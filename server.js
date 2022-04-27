const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }
  const headers = { 'Access-Control-Allow-Origin': '*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({...headers});
    try {
      return await next();
    } catch (e) {
      e.headers = {...e.headers, ...headers};
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }
    ctx.response.status = 204;
  }
});

app.use(koaBody({
  text: true,
  urlencoded: true,
  multipart: true,
  json: true,
}));

let globalId = 0;

class TicketFull {
  constructor(name, description, status) {
    this.id = globalId++;
    this.name = name;
    this.description = description;
    this.status = status;
    this.created = new Date().toLocaleDateString();
  }
}

let tickets = [new TicketFull(1, 'ticket', false)];

app.use(async ctx => {
  const { method, id } = ctx.request.query;

  switch (method) {
      case 'allTickets':
        ctx.response.body = tickets.map((ticket) => {return {
          id: ticket.id,
          name: ticket.name,
          status: ticket.status,
          created: ticket.created,
        }});
        return;
      case 'ticketById':
        const ticket = tickets.filter((element) => {return element.id === +id});
        
        ctx.response.body = ticket;
        return;
      case 'createTicket':
        const requestBody = ctx.request.body;
        const newTicket = new TicketFull(requestBody.name, requestBody.description, requestBody.status);
        tickets.push(newTicket);
        ctx.response.body = newTicket;
        return;
      default:
        ctx.response.status = 404;
        return;
  }
});

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback()).listen(port);
