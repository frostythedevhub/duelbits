const Redis = require('ioredis');
const io = require('socket.io-client');

const config = require('./config.js');

const client = new Redis();

const minPrice = config.minPrice * 100;
const maxPrice = config.maxPrice * 100;
const tradeUrl = config.tradeUrl;

const Sniper = function(){
    this.purchaseItem = async ({id, name, price, suggestedPrice})=>{
        if(price < minPrice || price > maxPrice) return;
        if(price / suggestedPrice > 1.05) return;
        
        let itemPrice = await client.get(name);
        if(!itemPrice) return;

        if(Number(itemPrice) > price * config.expectedROI){
            socket.emit('pay:p2p:join', {tradeUrl, id}, (data)=>{
                if(data){
                    return console.log(`[!!] Failed to purchase: ${name}. ${data}`);
                }
                console.log(`[!!!] Purchased ${name} ($${price/100})`);
            });
        }
        return;
    }
    this.purchaseBundle = async ({id, items})=>{
      var totalPrice = 0;
      var totalSuggested = 0;
      var totalMarket = 0;
      for (var item of items){
        totalPrice += item.price;
        totalSuggested += item.suggestedPrice;
        totalMarket += Number(await client.get(item.name));
      }

      if(totalPrice < minPrice || totalPrice > maxPrice) return;
      if(totalPrice / totalSuggested > 1.05) return;

      if(totalMarket > totalPrice * config.expectedROI){
        socket.emit('pay:p2p:join', {tradeUrl, id}, (data)=>{
          if(data){
              return console.log(`[!!] Failed to purchase: ${name}. ${data}`);
          }
          console.log(`[!!!] Purchased ${name} ($${price/100})`);
        });
      }
      return;
    }

    this.socket = io(`ws://websocket-prod.us-east-1.elasticbeanstalk.com/`, {
        extraHeaders: {
          'Origin': "https://duelbits.com",
          'Referer': 'https://duelbits.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36'
        },
        upgrade: false,
        transports: ['websocket']
    });

    this.socket.on('connect', ()=>{
        this.socket.emit('auth:authenticate', {
          access: config.duelbitsToken
        }, (err, data)=>{
          if(err == 'Invalid access token'){
            console.log('[!!!] Duelbits auth token is invalid.');
            process.exit(22);
          }
          console.log('[!] Logged into Duelbits.');
        });
    });

    this.socket.on('pay:p2p:newListing', (data) => {
        if(data.items.length == 1){
          this.purchaseItem({id: data.id, price: data.items[0].price, name: data.items[0].name, suggestedPrice: data.items[0].suggestedPrice});
        }else{
          this.purchaseBundle({id: data.id, items: data.items});
        }
    });
};

Sniper();