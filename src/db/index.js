const Mongoose = require('mongoose')
const usersSchema = require('./schemas/usersSchema')

const STATES = {
	0: 'Disconectado',
	1: 'Conectado',
	2: 'Conectando',
	3: 'Disconectando',
}

class CRUD {
	constructor() {
		this._connection = null
		this._collection = usersSchema
	}

	static connect() {
		Mongoose.connect(
			'mongodb://root:123456@mongodb:27017/admin',
			{useNewUrlParser: true},
			function (error) {
				if (!error) {
					return
				}
				console.log('Falha na conexão', error)
			}
		)
		this._connection = Mongoose.connection
		this._connection.once('open', () => console.log('database rodando!!'))
	}

	async isConnected() {
		const state = STATES[this._connection.readyState]
		if (state === 'Conectado') return state

		if (state !== 'Conectando') return state

		await new Promise(resolve => setTimeout(resolve, 1000))

		return STATES[this._connection.readyState]
	}

	async create(data) {
		return this._collection.create(data)
	}

	async update(uuid, data, returnData = false) {
		return this._collection.findOneAndUpdate({uuid}, {$set: data}, {new: returnData})
	}

	async search(data) {
		return this._collection.find(data)
	}

	async checkExist(data) {
		return this._collection.find(data).countDocuments()
	}
}

module.exports = CRUD