const Mongoose = require('mongoose')

const usersSchema = new Mongoose.Schema({
	uuid: {
		type: String,
		required: true
	},
	nome: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	senha: {
		type: String,
		required: true
	},
	telefones: [{
		numero: {
			type: Number
		},
		ddd: {
			type: Number
		}
	}],
	data_criacao: {
		type: Date,
		default: Date.now
	},
	data_atualizacao: {
		type: Date
	},
	ultimo_login: {
		type: Date,
		default: Date.now
	}, 
	token:  {
		type: String,
		required: true
	}
})

module.exports = Mongoose.model('users', usersSchema)