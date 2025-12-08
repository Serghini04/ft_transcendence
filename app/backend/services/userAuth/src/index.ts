import fastify from "fastify";
import db from "./db";
import bcrypt from "bcrypt";
import { Console, error } from "console";
import {OAuth2Client } from "google-auth-library";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { request } from "http";
import {generateJwtAccessToken, generateJwtRefreshToken, verifyRefreshToken } from "./jwt";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { generateOTP, sendOTPEmail } from "./2FA";
import { access } from "fs";


interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}


const app = fastify();
await app.register(cookie, {
  secret: process.env.COOKIE_SECRET,
});
await app.register(cors, {
  origin: "http://localhost:5173", // for development only
  credentials: true,
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
    db.prepare(`
      CREATE TABLE IF NOT EXISTS temp_users (
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        expiry INTEGER NOT NULL
        )
    `).run();
        


app.get("/", async () => {
  return { message: "SQLite DB connected" };
});

const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|\\:;"'<>,.?/]).{8,}$/;

const client = new OAuth2Client("917057465162-k81haa2us30sg6ddker0bu9gk4qigb9r.apps.googleusercontent.com");


app.post("/api/v1/auth/googleSignup", async (request, reply) => {
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
    console.log("Refresh Token:", RefreshToken); 
    // console.log("Generated JWT Token:", AccessToken);
    reply.setCookie("refreshToken", RefreshToken, {
      httpOnly: true,
      secure: false,     
      sameSite: "lax",
      path: "/",          
      maxAge: 60 * 60 * 24 * 7, 
    })
    .status(201).send({
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

app.post("/api/v1/auth/googleLogin", async (request, reply) => {
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
    reply.setCookie("refreshToken", RefreshToken, {
      httpOnly: true,
      secure: false,     
      sameSite: "lax",
      path: "/",       
      maxAge: 60 * 60 * 24 * 7, 
    })
    .status(201).send({
      message : "Google Login successful",
      AccessToken: AccessToken,
      user: userInfo,
      code: "USER_ADDED_SUCCESS" });
  }
  catch(err){
    console.error(err);
    reply.status(401).send("Invalid Google token");
  }
});

app.post("/api/v1/auth/login", async (request, reply) => {
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

    //generate OTP
    const otp = generateOTP();
    sendOTPEmail(row.email, otp);

    //jwt token generation
    // const getJwtParams = db.prepare("SELECT * FROM users WHERE name = ?").get(username) as User;
    // const AccessToken = generateJwtAccessToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
    // const RefreshToken = generateJwtRefreshToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
    // console.log("Generated JWT Token:", AccessToken);
    reply.status(201).send({ 
      message: "Login successful",
      user: userInfo,
      otp: otp,
      code: "USER_ADDED_SUCCESS" });

  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: "Internal server error" });
  }
});

app.post("/api/v1/auth/verifyEmail", async (request, reply) => {
  try {
    const { emailOrName, key } = request.body as { emailOrName: string; key: string };

    //stor in db
    console.log("Verifying email for:", emailOrName, "with key:", key);
    let row = {} as User;
    let userInfo = {id: 0, name: "", email: ""};
    if (key === "signup")
    {
      const pending = db.prepare("SELECT * FROM temp_users WHERE email = ?").get(emailOrName) as {name: string; email: string; password: string; expiry: number} | undefined;

    if (!pending) {
      reply.status(400).send({ error: "No pending signup found for this email", code: "NO_PENDING_SIGNUP" });
      return ;
    }

    db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
      .run(pending.name, pending.email, pending.password);

    // Remove from pending_users
    db.prepare("DELETE FROM temp_users WHERE email = ?").run(emailOrName);

    // save user info for sending back to client
      row = db.prepare("SELECT * FROM users WHERE email = ?").get(emailOrName) as User;
      userInfo = {
        id: row.id,
        name: row.name,
        email: row.email
      }
    }
    else if (key === "login")
    {
      row = db.prepare("SELECT * FROM users WHERE name = ?").get(emailOrName) as User;
      userInfo = {
        id: row.id,
        name: row.name,
        email: row.email
      }
    }
      
      const AccessToken = generateJwtAccessToken({id: row.id, name: row.name, email: row.email});
      const RefreshToken = generateJwtRefreshToken({id: row.id, name: row.name, email: row.email});

    return reply.setCookie("refreshToken", RefreshToken, {
              httpOnly: true,
              secure: false,      
              sameSite: "lax",
              path: "/",           
              maxAge: 60 * 60 * 24 * 7, 
            }).status(200).send({ message: "Signup completed", code: "VERIFICATION_SUCCESS", accessToken: AccessToken, user: userInfo });


  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: "Internal server error!" });
  }
});


app.post("/api/v1/auth/signup", async (request, reply) => {
  try {
    const { name, email, password, cpassword} = request.body as { name: string; email: string; password: string; cpassword: string};
  
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

      //generate OTP
      const otp = generateOTP();
      sendOTPEmail(email, otp);
      //hashing password
      const hashedPassword = await bcrypt.hash(password, 10);
      //stor in db
      const expiry = Date.now() + 10 * 60 * 1000; 
      db.prepare("INSERT INTO temp_users (name, email, password, expiry) VALUES (?, ?, ?, ?)").run(name, email, hashedPassword, expiry);

      //save user info for sending back to client
      const row = db.prepare("SELECT * FROM temp_users WHERE email = ?").get(email) as User;
      const userInfo = {
        name: row.name,
        email: row.email
      }
      
      //jwt token generation
      // const getJwtParams = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User;
      // const AccessToken = generateJwtAccessToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
      // const RefreshToken = generateJwtRefreshToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
    
    reply
    .status(201).status(201).send({
      message: "User added successfully",
      otp: otp,
      user: userInfo,
      code: "USER_ADDED_SUCCESS" });
  } catch (err: any) {
      console.error(err);
      reply.status(500).send({ error: "Internal server error!" });
  }
});

app.post("/api/v1/auth/forgotPassword", async (request, reply) => {
  try {
    const { username } = request.body as { username: string; };
    
    if (!username) {
      reply.status(400).send({ error: "Username is required" });
      return ;
    }
    const user = db.prepare("SELECT * FROM users WHERE name = ?").get(username) as User | undefined;
    if (!user) {
      reply.status(401).send({ error: "Invalid username", code: "INVALID_CREDENTIALS" });
      return ;
    }
    
    //generate new password
    const newPassword = Math.random().toString(36).slice(-8);
    sendOTPEmail(user.email, newPassword);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE name = ?").run(hashedPassword, username);
    
    reply.status(201).send({ 
      message: "Password changed successfully",
      code: "PASSWORD_CHANFED_SUCCESS" });
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: "Internal server error" });
  }
});

// app.post("/api/v1/auth/signup", async (request, reply) => {
//     try {
//       const { name, email, password, cpassword , key} = request.body as { name: string; email: string; password: string; cpassword: string; key?: string };
    
      
//       let AccessToken: string = "";
//       let RefreshToken: string = "";
//       let userInfo: {id: number; name: string; email: string;} = {id: 0, name: "", email: ""};
//       let otp: string = "";
//       if (key === "KO")
//         {
//         if (!name || !email || !password || !cpassword) {
//           reply.status(400).send({ error: "All fields are required" });
//           return ;
//         }
//         const isNameExist = db.prepare("SELECT * FROM users WHERE name = ?").get(name);
//         const isEmailExist = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
//         if (isNameExist || isEmailExist)
//         {
//           if (isNameExist)
//             reply.status(400).send({ error: "Name already exists", code: "NAME_ALR_EXIST"});
//           if (isEmailExist)
//             reply.status(400).send({ error: "Email already exists", code: "EMAIL_ALR_EXIST"});
//           return ;
//         }
//         if (!strongPassword.test(password))
//         {
//           reply.status(400).send({ error: "Min 8 chars, 1 uppercase, 1 number, 1 symbol", code: "PASSWORD_NOT_STROMG"})
//           return ;
//         }
//         if (password != cpassword)
//         {
//           reply.status(400).send({error: "cpassword not matching", code: "CPASSWORD_NOT_MATCHING"})
//           return ;
//         }

//         //generate OTP
//         otp = generateOTP();
//         sendOTPEmail(email, otp);
//       }
//       else{
//         //hashing password
//         const hashedPassword = await bcrypt.hash(password, 10);
//         //stor in db
//         db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, hashedPassword);

//         //save user info for sending back to client
//         const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User;
//         userInfo = {
//           id: row.id,
//           name: row.name,
//           email: row.email
//         }
        
//         //jwt token generation
//         const getJwtParams = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User;
//         AccessToken = generateJwtAccessToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
//         RefreshToken = generateJwtRefreshToken({id: getJwtParams.id, name: getJwtParams.name, email: getJwtParams.email});
//     }
      
//       reply.setCookie("refreshToken", RefreshToken, {
//         httpOnly: true,
//         secure: false,      
//         sameSite: "lax",
//         path: "/",           
//         maxAge: 60 * 60 * 24 * 7, 
//       })
//       .status(201).status(201).send({
//         message: "User added successfully",
//         AccessToken: AccessToken,
//         otp: otp,
//         user: userInfo,
//         code: "USER_ADDED_SUCCESS" });
//     } catch (err: any) {
//         console.error(err);
//         reply.status(500).send({ error: "Internal server error!" });
//     }
//   });

app.get("/api/v1/auth/protect", async (request, reply) => {
    return reply.send({message: "Protected route accessed", user: request.user});
});

// app.post ("/auth/v1/verify-email", async (request, reply) => {
//   try {
//     const { otp } = request.body as { otp: string };
    
//     if (!otp) {
//       return reply.status(400).send({ error: "OTP is required" });
//     }

//   }
// });


app.listen({ port: 3004 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
