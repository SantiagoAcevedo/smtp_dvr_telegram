var fs = require('fs');
const https = require('https');
const {SMTPServer} = require('smtp-server');
const parser = require("mailparser").simpleParser
const { Telegraf } = require('telegraf')

const BOT_TOKEN = 'SEU TOKEN';
const chatId = 'SEU TELEGRAM CHAT ID'; //id do canal

const app = new Telegraf(BOT_TOKEN);

console.log('Sistema Iniciado!')
app.telegram.sendMessage(chatId, 'BOT INICIADO!');

const server = new SMTPServer({
    disabledCommands: ['STARTTLS'],
    authMethods: ['PLAIN', 'LOGIN', 'CRAM-MD5'],
    logger: false,
    onAuth(auth, session, callback) {
        let username = 'santiago';
        let password = 'santiago';

        if (
            auth.username === username &&
            (auth.method === 'CRAM-MD5'
                ? auth.validatePassword(password) 
                : auth.password === password)
        ) {
            return callback(null, {
                user: 'userdata'
            });
        }

        return callback(new Error('Falha ao autenticar'));
    },
    onData(stream, session, callback){
        parser(stream, {}, (err, parsed) => {
            function myFunction(item) {
                fs.writeFile('img/'+item.filename, item.content, (err) => {
                    if (err)
                        console.log(err);
                    else {
                        console.log("Arquivo "+item.filename+" salvo\n");
                        //console.log("Erro ao salvar imagem");
                        app.telegram.sendPhoto(chatId, { source: 'img/'+item.filename }).then(function(data){
                                console.log(data);
                                fs.unlink('img/'+item.filename, (err) => {
                                    if (err) {
                                        console.error(err)
                                        return
                                    }
                                  //file removed
                                })
                        });
                        
                    }
                });
                //app.telegram.sendPhoto(chatId, { source: 'img/'+item.filename })
                
            }
            if (err)
                console.log("Error:" , err)
            //console.log(parsed)
            console.log(parsed)
            //let img = encodeURI(parsed.attachments);
            let fix = encodeURI(parsed.text);
            if(parsed.attachments.length > 0){
                parsed.attachments.forEach(myFunction)
                let envia = app.telegram.sendMessage(chatId, parsed.text);
                console.log(envia);
            }else{
                let envia = app.telegram.sendMessage(chatId, parsed.text);
                console.log(envia);
            }    

            console.log('DEBUG::: '+parsed.subject)
            stream.on("end", callback)
        })
        stream.pipe(process.stdout); // print message to console
        stream.on('end', callback);
    },
});
server.listen(587, 'SEUIP');
