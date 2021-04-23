const net = require('net')
const nacl = require('tweetnacl')
const Msg = require('./protos/msg_pb.js').Msg
const Task = require('./protos/esl_pb.js').Task
const Base = require('./protos/esl_pb.js').Base
const Label = require('./protos/esl_pb.js').Label

// let ip = '3.140.176.47'
// let ip = '3.128.33.4'
const ip = '192.168.1.92'
const port = 1234
console.log(`connect ${ip}:${port}`)

const secret = '425172b35dcca86adb460d15d4ef364f9d0a9bab75b300de63f7208d942c92746abf13e9f8c80e325e62a895bf5926542362579472f3a99c5a748ae899d9df59'
// const secret = 'd598df95b6a3c57675f2c72ff3bfc7c860e6f71981c214acb492a576c99ef60e552640401f3ab101f4bd93a52386008c4d88f94ba1acbbf54838f82f0c1c2706'
const keypair = nacl.sign.keyPair.fromSecretKey(Uint8Array.from(Buffer.from(secret, 'hex')))

const VER = 0, CODE = 7
//                   7    12                               -- label id
//                                     25   30             -- label id
//                                                 37 40   -- token
let sample = '@0001B60289FE0000111001A40289FE330700D4B000ED0000FC00000000006700D7000000A900C233F00122F001A8F00122F001A8F00122F001A8F00122F001A8F00122F001A64A81FC8E074D01A54A87FE8E81EFFE01A44A8F478783CFFE01A6F08F83E1E1E1E001A7F08C81E0F3C1E001A7F08F4983DC8701ACF09F4981F88701ACF09F4907F88701ACF09C10F88701ACF09C0FFC83C001A6F09E0EF781E001A7F08E0EF3C1E001A7F8CFC0E1E1E1F101A8478F488E8783FC01A64787489C83C3FC01A8FC87F8B883C1F8001212FC80000000806700D70000000300E856'

// const token_num = 13919
const token_num = Math.round(Math.random() * (65535 - 0) + 0)
const token = token_num.toString(16).toUpperCase()
sample = sample.replace('D4B0', token)

let id = '028A2F'
sample = sample.split('0289FE').join(id)

// let consumer = "99.247.136.70-0002-05"
// let consumer = "192.168.1.200-0001-01"
let consumer = "192.168.1.200-0002-05"
let task = new Task()
let task_bytes = Buffer.from(sample, 'ascii')
console.log(`task token=${token} label=${id} data-len=${task_bytes.length}`)
task.setConsumer(consumer)
task.setData(task_bytes)

let msg = new Msg()
let data = task.serializeBinary()
let signature = nacl.sign.detached(data, keypair.secretKey)
msg.setVer(VER)
msg.setCode(CODE)
msg.setData(data)
msg.setPublic(keypair.publicKey)
msg.setSignature(signature)

let socket = new net.Socket()
socket.connect(port, ip, _=>{
	socket.on('data', (data)=>{
		let msg = Msg.deserializeBinary(data)
		switch(msg.getCode()) {
			case 6:
				let base = Base.deserializeBinary(msg.getData())
				console.log(`base id=${base.getId()} connect=${base.getConnect()}`)
			break;
			case 8: 
				let label = Label.deserializeBinary(msg.getData())
				console.log(`label token=${label.getToken()} id=${label.getId()}  signal=${label.getSignal()} power=${label.getPower()} tempreture=${label.getTempreture()}`)
			break;
			default:
				console.log('unknown codec', msg.getCode()) 
			break;
		}
	})

	socket.write(msg.serializeBinary())
})