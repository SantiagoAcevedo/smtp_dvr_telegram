var fs = require('fs');
const https = require('https');
const {SMTPServer} = require('smtp-server');
const parser = require("mailparser").simpleParser
const { Telegraf } = require('telegraf')

const BOT_TOKEN = 'TELEGRAM TOKEN';
const chatId = 'CHATID';

const app = new Telegraf(BOT_TOKEN);

const server = new SMTPServer({
    disabledCommands: ['STARTTLS'],
    authMethods: ['PLAIN', 'LOGIN', 'CRAM-MD5'],
    logger: false,
    onAuth(auth, session, callback) {
        let username = 'SMTP_USER';
        let password = 'SMTP_SENHA';
        if (
            auth.username === username &&
            (auth.method === 'CRAM-MD5'
                ? auth.validatePassword(password) // if cram-md5, validate challenge response
                : auth.password === password) // for other methods match plaintext passwords
        ) {
            return callback(null, {
                user: 'userdata' // value could be an user id, or an user object etc. This value can be accessed from session.user afterwards
            });
        }

        return callback(new Error('Authentication failed'));
    },
    onData(stream, session, callback){
        parser(stream, {}, (err, parsed) => {
            function myFunction(item) {
                fs.writeFile('img/'+item.filename, item.content, (err) => {
                    if (err)
                        console.log(err);
                    else {
                        console.log("Arquivo "+item.filename+" salvo\n");
                        console.log("Erro ao salvar imagem");
                    }
                });
                app.telegram.sendPhoto(chatId, { source: 'img/'+item.filename })
				fs.unlink('img/'+item.filename, (err) => {
				  if (err) {
					console.error(err)
					return
				  }				  
				})
            }
            if (err)
                console.log("Error:" , err)
         
            console.log(parsed)
            let fix = encodeURI(parsed.text);
            if(parsed.attachments.length > 0){
                parsed.attachments.forEach(myFunction)
                app.telegram.sendMessage(chatId, parsed.text);
            }

            console.log('DEBUG::: '+parsed.subject)
            stream.on("end", callback)
        })
        stream.pipe(process.stdout); // print message to console
        stream.on('end', callback);
    },
});
server.listen(587, 'SERVER_IP');