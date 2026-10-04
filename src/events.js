const clients=new Set();
export function emit(event,data={}){const payload="event: "+event+"\ndata: "+JSON.stringify(data)+"\n\n";for(const res of clients){try{res.write(payload)}catch{clients.delete(res)}}}
export function subscribe(res){clients.add(res);return()=>clients.delete(res)}
export function clientCount(){return clients.size}
