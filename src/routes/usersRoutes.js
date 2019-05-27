const Joi = require('joi')
const BaseRoute = require('./base/baseRoute')
const Boom = require('boom')
// const {Types: {ObjectId}} = require('mongoose')
const shajs = require('sha.js')
const uuidv4 = require('uuid/v4')
const Jwt = require('jsonwebtoken')

const telefone = Joi.object().keys({
	numero: Joi.number().integer().min(10000000).max(999999999),
	ddd: Joi.number().integer().min(11).max(99)
})

const JWT_KEY = '@ugR@1-(@!mXq8rx7zE(b9>!!L-!8o'

class UsersRouter extends BaseRoute {
	constructor(db) {
		super()
		this.db = db
	}

	signup() {
		return {
			path: '/signup',
			method: 'POST',
			config: {
				tags: ['api'],
				description: 'Cadastrar usuário',
				notes: 'Faz o cadastror do usuário.',
				validate: {
					failAction: (request, h, err) => {
						throw err
					},
					payload: {
						nome: Joi.string().max(250).required(),
						email: Joi.string().max(250).email({ minDomainSegments: 2 }),
						senha: Joi.string().max(20).required(),
						telefones: Joi.array().items(telefone),
						token: Joi.string().required()
					}
				},

			},
			handler: async (request) => {
				const payload = request.payload
				payload.uuid = uuidv4()
				payload.senha = shajs('sha256').update(payload.senha).digest('hex')
				const res = await this.db.checkExist({email: payload.email})				
				if (res > 0) {
					return Boom.conflict('E-mail já existente')
				}
				return this.db.create(payload)
			}
		}
	}

	signin() {
		return {
			path: '/signin',
			method: 'POST',
			config: {
				tags: ['api'],
				description: 'Login do usuário',
				notes: 'Faz o login do usuário',
				validate: {
					failAction: (request, h, err) => {
						throw err
					},
					payload: {
						email: Joi.string().max(250).email({ minDomainSegments: 2 }),
						senha: Joi.string().max(20).required()					
					}
				},

			},
			handler: async (request) => {
				const payload = request.payload
				const [res] = await this.db.search({email: payload.email})
				if (!res) {
					return Boom.notFound('Usuário e/ou senha inválidos')
				}
				if (res.senha !== shajs('sha256').update(payload.senha).digest('hex')) {
					return Boom.unauthorized('Usuário e/ou senha inválidos')
				}
				const ultimo_login = Date.now()
				await this.db.update(res._id, {ultimo_login})
				res.ultimo_login = ultimo_login
				return res
			}
		}
	}

	search() {
		return {
			path: '/search/{user_id}',
			method: 'POST',
			config: {
				tags: ['api'],
				description: 'Pesquisa usuário',
				notes: 'Pesquisa usuário pelo uuid.',
				validate: {
					failAction: (request, h, err) => {
						throw err
					},
					params: {
						user_id: Joi.string().required()
					},
					payload: {
						token: Joi.string().required()
					}
				},
 
			},
			handler: async (request) => {
				const token = request.payload.token
				try {
					Jwt.verify(token, JWT_KEY)
				} catch(err) {
					return Boom.unauthorized('Não autorizado')
				}

				const [res] = await this.db.search({uuid: request.params.user_id})
				if (!res) {
					return Boom.notFound('Usuário não encontrado')
				}
				if (token !== res.token) {
					return Boom.unauthorized('Não autorizado')
				}
				if (new Date(res.ultimo_login).getTime() < (Date.now() - 180000)) {
					return Boom.unauthorized('Sessão inválida')
				}
				return res
			}
		}
	}

	edit() {
		return {
			path: '/edit/{user_id}',
			method: 'POST',
			config: {
				tags: ['api'],
				description: 'Edita usuário',
				notes: 'Edita as informações do usuário',
				validate: {
					failAction: (request, h, err) => {
						throw err
					},
					params: {
						user_id: Joi.string().required()
					},
					payload: {
						nome: Joi.string().max(250),
						email: Joi.string().max(250).email({ minDomainSegments: 2 }),
						senha: Joi.string().max(20),
						telefones: Joi.array().items(telefone),
						token: Joi.string()
					}
				}
			},
			handler: async (request) => {
				const payload = request.payload
				payload.data_atualizacao = Date.now()
				if (payload.senha) {
					payload.senha = shajs('sha256').update(payload.senha).digest('hex')
				}
				if (payload.email) {
					const res = await this.db.checkExist({email: payload.email})				
					if (res > 0) {
						return Boom.conflict('E-mail já existente')
					}
				}
				return await this.db.update(request.params.user_id, payload, true)
			}
		}
	}
}

module.exports = UsersRouter