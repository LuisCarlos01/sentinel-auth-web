# React + Vite SPA em vez de Next.js

O frontend não tem requisito de SEO ou server-rendering — é um app autenticado (registro/login/listagem admin) atrás de um login wall. Escolhemos React + Vite como SPA client-only em vez de Next.js pra evitar misturar o modelo de access token só-em-memória com server components, que não têm acesso ao state client-side do React. Um framework que oferece SSR por padrão (Next.js) precisaria de opt-out explícito em toda rota autenticada pra evitar esse descompasso; uma SPA simples nem tem esse problema pra começo de conversa.
