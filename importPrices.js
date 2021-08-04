const Redis = require('ioredis');
const axios = require('axios');
const JSONStream = require('JSONStream');
const es = require('event-stream');
const request = require('request');

const config = require('./config.js');

const client = new Redis();

var conversion = 0.15429655;

(async ()=>{
    console.log('[!] Fetching prices from pricempire...');
    //fetch new prices from pricempire
    /*let data = await axios({
        method: 'GET',
        url: `https://api.pricempire.com/v1/getAllItems?token=${config.pricempireKey}`
    }).catch((err)=>{
        console.log(err.response.data);
        process.exit(22);
    });
    //update db with new prices
    console.log('[!] Fetched prices from pricempire.');
    
    for(const item of data.data.items){
        if(!item || !item.prices.buff163 || !item.prices.buff163_quick) continue;
        num++;
        let price;
        if((item.prices.buff163.price * .88) > item.prices.buff163_quick.price){
            price = item.prices.buff163_quick.price * 0.15;
        } else{
            price = item.prices.buff163.price * 0.15;
        }
        //client.set(item.name, price);
        console.log(`[${num}] Inserted: ${item.name} ($${(price/100).toFixed(2)})`);
    }*/
	let num = 0;
	request({
        method: 'GET',
        url: `https://api.pricempire.com/v1/getAllItems?token=${config.pricempireKey}`
    })
	.pipe(JSONStream.parse('*.*'))
	.pipe(es.mapSync((item)=>{
		if(!item || !item.prices.buff163 || !item.prices.buff163_quick) return;
        num++;
        let price;
        if((item.prices.buff163.price * .80) > item.prices.buff163_quick.price){
            price = item.prices.buff163.price * 0.90 * conversion;
        } else{
            price = item.prices.buff163.price * conversion;
        }
        client.set(item.name, price);
        console.log(`[${num}] Inserted: ${item.name} ($${(price/100).toFixed(2)})`);
	}));
})();