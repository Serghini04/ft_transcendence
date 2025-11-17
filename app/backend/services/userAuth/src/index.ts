import fastify from "fastify";
import "./db.ts";
import db from "./db.ts"; // no extension with ts-node
import cors from "@fastify/cors";
import bcrypt from "bcrypt";
import { Console, error } from "console";
import {OAuth2Client } from "google-auth-library";
import { request } from "http";
import { authenticateToken, generateJwtAccessToken, generateJwtRefreshToken } from "./jwt.ts";
import cookie from "@fastify/cookie";


interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}


const app = fastify();
await app.register(cors, {
  origin: true, // for development only
});


db.prepare(`DROP TABLE IF EXISTS users`).run();
// Create table if not exists

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`).run();

app.get("/", async () => {
  return { message: "SQLite DB connected" };
});

const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|\\:;"'<>,.?/]).{8,}$/;

const client = new OAuth2Client("917057465162-k81haa2us30sg6ddker0bu9gk4qigb9r.apps.googleusercontent.com");


app.post("/api/auth/googleSignup", async (request, reply) => {
  try{
    const {accessToken} = request.body as {accessToken: string};
    
    if (!accessToken) {
      return reply.status(400).send({ error: "Missing Google access token" });
    }

    const ticket = await client.getTokenInfo(accessToken);
    

    const email = ticket.email;
    let name = ticket.email?.split('@')[0];

    if (!email) {
      return reply.status(400).send({ error: "Invalid Google token" });
    }

    let isNameExist = db.prepare("SELECT * FROM users WHERE name = (?)").get(name);
    if (isNameExist)
    {
      for (let i = 0; isNameExist; i++)
      {
        name = (name ?? "") + Math.floor(Math.random() * 1000);
        isNameExist = db.prepare("SELECT * FROM users WHERE name = (?)").get(name);
      }
    }
    const isEmailExist = db.prepare("SELECT * FROM users WHERE email = (?)").get(email);
    if (isEmailExist)
      return reply.status(401).send({ error: "email previously used" }); 
    else
      db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, "GOOGLE_USER");

    //save user info for sending back to client
    const row = db.prepare("SELECT * FROM users WHERE name = ?").get(name) as User;
    const userInfo = {
      id: row.id,
      name: row.name,
      email: row.email
    }

    //jwt token generation
    const getJwtParams = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User;
    const AccessToken = generateJwtAccessToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
    const RefreshToken = generateJwtRefreshToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
    // console.log("Generated JWT Token:", AccessToken);
    reply.send({
        message: "Google signup success",
        AccessToken: AccessToken,
        user: userInfo,
        code: "USER_ADDED_SUCCESS"
    });
  }
  catch(err){
    console.error(err);
    reply.status(401).send("Invalid Google token");
  }
})

app.post("/api/auth/googleLogin", async (request, reply) => {
  try{
    const {accessToken} = request.body as {accessToken: string};
    
    if (!accessToken) {
      return reply.status(400).send({ error: "Missing Google access token" });
    }
    
    const ticket = await client.getTokenInfo(accessToken);
    const email = ticket.email;
    const name = ticket.email?.split('@')[0];
  
    if (!email) {
      return reply.status(400).send({ error: "Invalid Google token" });
    }

    const isExist = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!isExist) {
      return reply.status(401).send({ error: "No account associated with this Google account" });
    }

    //save user info for sending back to client
    const row = db.prepare("SELECT * FROM users WHERE name = ?").get(name) as User;
    const userInfo = {
      id: row.id,
      name: row.name,
      email: row.email
    }

    //jwt token generation
    const getJwtParams = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User;
    const AccessToken = generateJwtAccessToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
    const RefreshToken = generateJwtRefreshToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
    console.log("Generated JWT Token:", AccessToken);
    reply.send({message : "Google Login successful", AccessToken: AccessToken, user: userInfo, code: "USER_ADDED_SUCCESS" });
  }
  catch(err){
    console.error(err);
    reply.status(401).send("Invalid Google token");
  }
});

app.post("/api/auth/login", async (request, reply) => {
  try {
    const { username, password } = request.body as { username: string; password: string };

    if (!username || !password) {
      reply.status(400).send({ error: "Username and password are required" });
      return ;
    }
    const user = db.prepare("SELECT * FROM users WHERE name = ?").get(username) as User | undefined;
    if (!user) {
      reply.status(401).send({ error: "Invalid username or password", code: "INVALID_CREDENTIALS" });
      return ;
    }
    else if (user.password === "GOOGLE_USER") {
      reply.status(401).send({ error: "Please login with Google OAuth" });
      return ;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      reply.status(401).send({ error: "Invalid Username or password", code: "INVALID_CREDENTIALS" });
      return ;
    }

    //save user info for sending back to client
    const row = db.prepare("SELECT * FROM users WHERE name = ?").get(username) as User;
      const userInfo = {
        id: row.id,
        name: row.name,
        email: row.email
      }

    //jwt token generation
    const getJwtParams = db.prepare("SELECT * FROM users WHERE name = ?").get(username) as User;
    const AccessToken = generateJwtAccessToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
    const RefreshToken = generateJwtRefreshToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
    console.log("Generated JWT Token:", AccessToken);
    reply.send({ message: "Login successful", AccessToken: AccessToken, user: userInfo, code: "USER_ADDED_SUCCESS" });

  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: "Internal server erroR" });
  }
});

app.post("/api/auth/signup", async (request, reply) => {
    try {
      const { name, email, password, cpassword } = request.body as { name: string; email: string; password: string; cpassword: string};
    
      if (!name || !email || !password || !cpassword) {
        reply.status(400).send({ error: "All fields are required" });
        return ;
      }
      const isNameExist = db.prepare("SELECT * FROM users WHERE name = ?").get(name);
      const isEmailExist = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (isNameExist || isEmailExist)
      {
        if (isNameExist)
          reply.status(400).send({ error: "Name already exists", code: "NAME_ALR_EXIST"});
        if (isEmailExist)
          reply.status(400).send({ error: "Email already exists", code: "EMAIL_ALR_EXIST"});
        return ;
      }
      if (!strongPassword.test(password))
      {
        reply.status(400).send({ error: "Min 8 chars, 1 uppercase, 1 number, 1 symbol", code: "PASSWORD_NOT_STROMG"})
        return ;
      }
      if (password != cpassword)
      {
        reply.status(400).send({error: "cpassword not matching", code: "CPASSWORD_NOT_MATCHING"})
        return ;
      }

      //hashing password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      //stor in db
      db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, hashedPassword);

      //save user info for sending back to client
      const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User;
      const userInfo = {
        id: row.id,
        name: row.name,
        email: row.email
      }
      
      //jwt token generation
      const getJwtParams = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User;
      const AccessToken = generateJwtAccessToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
      const RefreshToken = generateJwtRefreshToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
      
      reply.status(201).send({ message: "User added successfully", AccessToken: AccessToken, user: userInfo, code: "USER_ADDED_SUCCESS" });
    } catch (err: any) {
        console.error(err);
        reply.status(500).send({ error: "Internal server error" });
    }
  });

app.get("/protect", {preHandler: authenticateToken}, async (request, reply) => {
    return reply.send({message: "Protected route accessed", user: request.user});
});

app.get("/users", async () => {
  const users = db.prepare("SELECT * FROM users").all();
  return users;
});

app.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
