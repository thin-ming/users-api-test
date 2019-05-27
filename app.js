'use strict'

const Hapi = require('hapi')
const HapiSwagger = require('hapi-swagger') 
const Inert = require('inert')
const Vision = require('vision')
const HapiJwt = require('hapi-auth-jwt2')
const db = require('./src/db')
const UsersRoutes = require('./src/routes/usersRoutes')

const swaggerConfig = {
	info: {
		title: '#User Api',
		version: '1.0'
	},
	lang: 'pt'
}

const app = new Hapi.Server({
	port: 5000
})

function mapRoutes(instance, methods) {
	return methods.map(method => instance[method]())
}

async function main() {
	db.connect()
	const connection = new db

	await app.register([
		HapiJwt,
		Inert,
		Vision,
		{
			plugin: HapiSwagger,
			options: swaggerConfig
		}
	])

	app.route(mapRoutes(new UsersRoutes(connection), UsersRoutes.methods()))

	await app.start()
	console.log('server running at', app.info.port)

	return app
}

module.exports = main()