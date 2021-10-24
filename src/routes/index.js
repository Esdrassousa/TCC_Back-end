const express = require('express')
require('dotenv').config()
const router = express.Router();
const Cloudant = require('@cloudant/cloudant');
const { all } = require('async');
const  url_ibm  = 'https://apikey-v2-2i7l0qp9wwbw87vpija9mi31o7yennrevo7fd87xpz00:974d78d495165a06f9f8a753ffe33542@42b86470-c6b5-4354-813b-727ba9f47dce-bluemix.cloudantnosqldb.appdomain.cloud';
const Bull = require("bull");
const cors = require('cors');
const redis = require("redis");
var jsonParser = express.json()
const Queue = new Bull("Queue", { redis: { port: 6379, host: "redis" } });
const myFirstQueue = new Bull('my-first-queue');

//////////////MQTT
const mqtt = require('mqtt')

const host = 'e0e240c0.us-east-1.emqx.cloud'
const port = 15496
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `mqtt://${host}:${port}`



//////////////////////
global.client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'admin',
    password: 'admin',
    reconnectPeriod: 1000,
  })

const liga = (router.post('/mqtt/liga', jsonParser ,async(request, response) =>{
   console.log("liga")
   
      const topic = 'teste'
 
      global.client.publish(topic, '1', { qos: 0, retain: false }, (error) => {
          if (error) {
            console.error(error)
          }
        })
     
  
        global.client.on('1', (topic, payload) => {
        console.log('Received Message:', topic, payload.toString())
      })


}))

const desliga = (router.post('/mqtt/desliga', jsonParser ,async(requeste, response) =>{

    
      
      const topic = 'teste'
      global.client.publish(topic, '0', { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      })
      global.client.on('0', (topic, payload) => {
        console.log('Received Message:', topic, payload.toString())
      })

}))


const route = (router.post('/', jsonParser ,  async (request,response) =>{
    //const myFirstQueue = new Bull('my-first-queue');
    //Queue.add({...request.body})
    const {minutes_recebidos}  = request.body
    var minutes_recebidos_int = parseInt(minutes_recebidos)
    console.log(minutes_recebidos_int)
    
    try{
        const cloudant = Cloudant({
            url:url_ibm,
            plugins:{
                iamauth:{
                    
                    iamApiKey : 'zAOvP080YFlleja6dHriE4WzpiPUoUJh9o-VeMpbTqPy'
                }
            }
        })




        //let allbd = await cloudant.db.list();
        //console.log(`${allbd}`)

        const db = (cloudant.db.use('amazenacorrente'))

        ///////data/////////////////////
        const data  =  new Date()
        mes_atual = data.getMonth()+1
        dia_atual  = data.getDate()
        ano_atual  = data.getFullYear()

        horas_atual = data.getHours()

        if (horas_atual == 00){
            horas_atual = 21
        }

        if (horas_atual == 01){
            horas_atual = 22
        }

        if (horas_atual == 02){
            horas_atual = 23
        }
        else{

            horas_atual = data.getHours() - 0
        }
        horas_atual = ((horas_atual < 10) ? '0' : '') + horas_atual
        minutes_atual  = data.getMinutes() + 2
        minutes_atual = ((minutes_atual < 10)? '0': '')+minutes_atual
        horas_anterior = horas_atual
        diminui = minutes_recebidos_int - minutes_atual
        console.log(minutes_recebidos_int > minutes_atual , diminui,minutes_recebidos_int,minutes_atual)

        
        
        if(minutes_recebidos_int > minutes_atual){

            console.log('entrou aqui', minutes_recebidos_int)
            horas_anterior = horas_atual - 1
            horas_anterior = ((horas_anterior < 10) ? '0' : '') + horas_anterior
            minute_anterior = 59 -  (minutes_recebidos_int - minutes_atual)
            console.log(minute_anterior)
            minute_anterior  = ((minute_anterior < 10) ? '0': '') + minute_anterior

            
        }else{
            minute_anterior = minutes_atual -  minutes_recebidos_int
            minute_anterior = ((minute_anterior < 10) ? '0' : '' ) + minute_anterior
            

        }
        
        

        
        data_completa_atual =  mes_atual + '/' + dia_atual + '/' + ano_atual + ',' + ' ' +  horas_atual + ":" + minutes_atual + ":" +'59'
        data_completa_anterior =  mes_atual + '/' + dia_atual + '/' + ano_atual + ',' + ' ' +  horas_anterior + ":" + minute_anterior + ":" +'00'

        //console.log('data atual: ',(String(data_completa_atual)))
        //console.log('data anterio : ', (String(data_completa_anterior)))
        ////////////////////////////////
        function delay_tempo(segundos){
            var start = new Date().getTime();
            var end = start

            while(end > start - segundos){
                start =  new Date().getTime()
            }

        }

        //delay_tempo(500)
        res =  await (db.find({ selector : {_id: { $gt: (String(data_completa_anterior)) , $lt: (String(data_completa_atual)) } }}))   
        //res =  await db.find({ selector : {_id: { $gt: '6/23/2021, 14:07:00' , $lt: '6/23/2021, 15:57:00' } }})   
        
        
        console.log(res)
        res = res['docs']
        
        tamanho = res.length
        console.log(res)
        //vetor =[['', 'corrente a', 'corrente b', 'corrente c']]
        vetor =[]
        horas_minutos = []
        Corrente1 = []
        Tensao1 = []
        Pot_aparente = []
        Pot_ativa = []
        FatorPotTotal = []
        for(i=0; i<tamanho ; i++){
           res1 = res[i]['_id'] 
           
           resI = res[i]

           ///TRIFASICO
           resDados = resI['dados']
           //resDados_completos = resDados
           resCorrente1 = resDados[0].corrente
           

           resTensao1 = resDados[0].tensao
           res_pot_aparente = resDados[0].pot_aparente
           res_pot_ativa = resDados[0].pot_ativa
           resFatorPotTotal = resDados[0].fp
        
           
           /* resFatorPot1 = parseFloat(resDados[0].pfa)
           resFatorPot2 = parseFloat(resDados[0].pfb)
           resFatorPot3 = parseFloat(resDados[0].pfc)

           resFatorPotTotal = parseFloat(resDados[0].pft)
           console.log(resCorrente1)
           if (resFatorPot1 < 0){
            resFatorPot1 = resFatorPot1*(-1)
           }
           if (resFatorPot2 < 0){
            resFatorPot2 = resFatorPot2*(-1)
           }
           if (resFatorPot3 < 0){
            resFatorPot3 = resFatorPot3*(-1)
           }

           if (resFatorPotTotal < 0){
            resFatorPotTotal = resFatorPotTotal*(-1)
           } */

           const splits = resI['data'].split(',')
           const splits2 = splits[1].split(':')
           const res_horas_minutos = splits2[0] + ':' + splits2[1]      
           //console.log('aqui é: ', resCorrente1)
           //console.log('a hora é:: ', horas_minutos)
           //vetor.push([resI['data'],parseFloat(resI['ia'])])
           ///MONOFASICO
           //vetor.push([horas_minutos,parseFloat(resI['ia'])])
           if (i%2 === 0){horas_minutos.push(null)}else{
            horas_minutos.push(res_horas_minutos)
            
           }
           
           Corrente1.push(parseFloat(resCorrente1))
           
           Tensao1.push(parseFloat(resTensao1))
           Pot_aparente.push(parseFloat(res_pot_aparente))
           Pot_ativa.push(parseFloat(res_pot_ativa))
           FatorPotTotal.push(parseFloat(resFatorPotTotal))
           //vetor.push([horas_minutos,parseFloat(resCorrente1),parseFloat(resCorrente2),parseFloat(resCorrente3)])
           
           //console.log(Pot_aparente)
        }
 //console.log(vetor.slice(0,10))
        await vetor.push([horas_minutos],[Corrente1],[Tensao1],[Pot_aparente],[Pot_ativa],[FatorPotTotal])
        /* await vetor.push([horas_minutos],[Corrente1],[Corrente2],[Corrente3],
                            [Tensao1],[Tensao2],[Tensao3],
                            [resFatorPot1],[resFatorPot2],[resFatorPot3],
                            [FatorPotTotal]) */
        response.setHeader('Access-Control-Allow-Origin', process.env.URL);
        response.setHeader('Access-Control-Allow-Credentials', true);

        await response.status(200).send(vetor);
        
        //console.log(vetor)
        //console.log(vetor.slice((vetor.length  - 5),(vetor.length)))
      
    }catch(err){
        console.log(err);
    }
    

}))

module.exports =route
