import fastify from "fastify";
import db from "./db.js";
import bcrypt from "bcrypt";
import { Console, error, profile, timeStamp } from "console";
import {OAuth2Client } from "google-auth-library";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { request } from "http";
import {generateJwtAccessToken, generateJwtRefreshToken, verifyRefreshToken } from "./jwt.js";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import { generateOTP, sendOTPEmail } from "./2FA.js";
import { access } from "fs";
import { str } from "ajv";
import multer from "multer";
import path from "path";
import fs from "fs";
import multipart, { MultipartFile } from "@fastify/multipart"
import { pipeline } from "stream/promises";
import { promiseHooks } from "v8";
import { UserEvent, kafkaProducerService } from "./kafka/producer.js";
import { vaultClient } from "./utils/vault.client.js";

let secrets: any = null;
interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  photoURL?: string;
  bgPhotoURL?: string;
  profileVisibility?: boolean;
  showNotifications?: boolean;
  bio?: string;
}

// Initialize fastify app first
const app = fastify();

// Load secrets from Vault
console.log('Loading secrets from Vault...');
secrets = await vaultClient.loadSecrets();
console.log('Secrets loaded successfully from Vault:', {
  hasJwtSecret: !!secrets.JWT_SECRET,
  hasJwtRefresh: !!secrets.JWT_REFRESH,
  hasCookieSecret: !!secrets.COOKIE_SECRET,
  hasInternalSecret: !!secrets.INTERNAL_SECRET_KEY,
  hasEmailUser: !!secrets.EMAIL_USER,
  hasEmailPassword: !!secrets.EMAIL_PASSWORD,
});
    
app.log.info({
  hasJwtSecret: !!secrets.JWT_SECRET,
  hasJwtRefresh: !!secrets.JWT_REFRESH,
  hasCookieSecret: !!secrets.COOKIE_SECRET,
  hasInternalSecret: !!secrets.INTERNAL_SECRET_KEY,
}, "Secrets loaded from Vault");

export { secrets };
await app.register(cookie, {
  secret: secrets.COOKIE_SECRET,
});

await app.register(cors, {
  origin: ["http://localhost:5173"],
  credentials: true,
});
await app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 2,
  }
});

// Register static file serving for uploads
const uploadsDir = process.env.NODE_ENV === 'production' 
  ? '/app/uploads' 
  : path.join(process.cwd(), 'uploads');
  
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

await app.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
});


// consumer.connect(5000);



// db.prepare(`DROP TABLE IF EXISTS temp_users`).run();
// db.prepare(`DROP TABLE IF EXISTS users`).run();

// Create table if not exists

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    photoURL TEXT,
    bgPhotoURL TEXT,
    bio TEXT NOT NULL,
    profileVisibility BOOLEAN DEFAULT true,
    showNotifications BOOLEAN DEFAULT true
    )
    `).run();
    db.prepare(`
      CREATE TABLE IF NOT EXISTS temp_users (
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        photoURL TEXT,
        bgPhotoURL TEXT,
        bio TEXT NOT NULL,
        profileVisibility BOOLEAN DEFAULT true,
        showNotifications BOOLEAN DEFAULT true,
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
    const {accessToken, photoURL, bgPhotoURL} = request.body as {accessToken: string, photoURL: string, bgPhotoURL: string};

  
    
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
          db.prepare("INSERT INTO users (name, email, password, photoURL, bgPhotoURL, bio) VALUES (?, ?, ?, ?, ?, ?)").run(name, email, "GOOGLE_USER", photoURL, bgPhotoURL, "Hello, I am using PingPong App!");
        
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

    const isProd = process.env.NODE_ENV === "production";

    // console.log("Generated JWT Token:", AccessToken);
    reply.setCookie("refreshToken", RefreshToken, {
      httpOnly: true,
      secure: isProd,                    // true only in prod
      sameSite: isProd ? "none" : "lax", // none only in prod
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
    reply.status(401).send({ error: "Invalid Google token" });
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
    const isProd = process.env.NODE_ENV === "production";

    // console.log("Generated JWT Token:", AccessToken);
    reply.setCookie("refreshToken", RefreshToken, {
      httpOnly: true,
      secure: isProd,                    // true only in prod
      sameSite: isProd ? "none" : "lax", // none only in prod
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

    const match = await bcrypt.compare(password, user.password as string);
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

3    //jwt token generation
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
      const pending = db.prepare("SELECT * FROM temp_users WHERE email = ?").get(emailOrName) as User | undefined;

    if (!pending) {
      reply.status(400).send({ error: "No pending signup found for this email", code: "NO_PENDING_SIGNUP" });
      return ;
    }

    db.prepare("INSERT INTO users (name, email, password, photoURL, bgPhotoURL, bio) VALUES (?, ?, ?, ?, ?, ?)").run(pending.name, pending.email, pending.password, pending.photoURL, pending.bgPhotoURL, pending.bio);

    // const message = {
    //   event: 'USER_CREATED',
    //   user: {
    //     id: pending.id,
    //     name: pending.name,
    //     email: pending.email,
    //     photoURL: pending.photoURL,
    //     bgPhotoURL: pending.bgPhotoURL,
    //     bio: pending.bio
    //   },
    //   timestamp: new Date().toISOString()
    // };
    // const result = await producer.send(message);
    // console.log("Kafka message sent result:", result);
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

      const isProd = process.env.NODE_ENV === "production";

      const message : UserEvent = {
        userId: String(row.id),
        name: row.name,
        email: row.email,
        photoURL: row.photoURL || "",
        bgPhotoURL: row.bgPhotoURL || "",
        bio: row.bio || "",
        profileVisibility: row.profileVisibility || true,
        showNotifications: row.showNotifications || true
      }
      kafkaProducerService.publishUserCreated(message);

      // console.log("Generated JWT Token:", AccessToken);
      reply.setCookie("refreshToken", RefreshToken, {
        httpOnly: true,
        secure: isProd,                    // true only in prod
        sameSite: isProd ? "none" : "lax", // none only in prod
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
    const { name, email, password, cpassword, photoURL, bgPhotoURL} = request.body as { name: string; email: string; password: string; cpassword: string, photoURL: string; bgPhotoURL: string; };
  
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
      db.prepare("INSERT INTO temp_users (name, email, password, expiry, photoURL, bgPhotoURL, bio) VALUES (?, ?, ?, ?, ?, ?, ?)").run(name, email, hashedPassword, expiry, photoURL, bgPhotoURL, "Hello, I am using PingPong App!");

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

app.post("/api/v1/auth/setting/getUserData", async (request, reply) => {
  try {
    const { id } = (request.body as {id: number});
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
    if (!user) {
      reply.status(401).send({ error: "Invalid user id", code: "INVALID_USER_ID" });
      return ;
    }
    const userInfo = {
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      bgPhotoURL: user.bgPhotoURL,
      profileVisibility: user.profileVisibility,
      showNotifications: user.showNotifications,
      bio: user.bio
    }
    reply.status(201).send({ 
      message: "User data fetched successfully",
      user: userInfo,
      code: "USER_DATA_FETCHED_SUCCESS" });
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: "Internal server error" });
  }
});

function safeDelete(fileUrl?: string | null) {
  if (!fileUrl) return;

  const filePath = path.join(uploadsDir, path.basename(fileUrl)); // Use uploadsDir

  fs.unlink(filePath, err => {
    if (err && err.code !== "ENOENT") {
      console.error("Failed to delete old file:", err);
    }
  });
}

app.post("/api/v1/auth/setting/uploadPhotos", async (req, reply) => {
  const parts = req.parts();

  let photoURL: string | null = null;
  let bgPhotoURL: string | null = null;
  let userId: number | null = null;

  for await (const part of parts) {
    // ✅ handle fields
    if (part.type === "field" && part.fieldname === "id") {
      userId = Number(part.value);
    }

    // ✅ handle files
    if (part.type === "file") {
      if (!userId) continue;

      const filePart = part as MultipartFile;
      const ext = path.extname(filePart.filename);
      let filename = "";
      let field = "";

      const timestamp = Date.now();
      if (part.fieldname === "photo") {
        field = "photoURL";
        filename = `user-${userId}-photo${timestamp}${ext}`;
        photoURL = `uploads/${filename}`;
      }

      if (part.fieldname === "bgPhoto") {
        field = "bgPhotoURL";
        filename = `user-${userId}-bg${timestamp}${ext}`;
        bgPhotoURL = `uploads/${filename}`;
      }

      if (!filename) continue;

      const old = db
        .prepare(`SELECT ${field} FROM users WHERE id = ?`)
        .get(userId) as any;

      const savePath = path.join(uploadsDir, filename); // Use uploadsDir
      await pipeline(filePart.file, fs.createWriteStream(savePath));

      if (old?.[field]) {
        safeDelete(old[field]);
      }
    }
  }

  reply.send({
    photoURL,
    bgPhotoURL,
  });
});

// ...existing code...


app.post("/api/v1/auth/setting/updateUserData", async (request, reply) => {
  try {
    const {id , name, password, newpassword, cnewpassword, photoURL, bgPhotoURL, profileVisibility, showNotifications, bio} = (request.body as {id: number; name: string; email: string; password:string; newpassword: string; cnewpassword:string; photoURL: string; bgPhotoURL: string; profileVisibility: boolean; showNotifications: boolean; bio: string; });

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User;
    if (user && user.id !== id) {
      reply.status(400).send({ error: "Name already exists", code: "NAME_ALR_EXIST"});
      return ;
    }
    if (name !== "")
      db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, id);
    if (photoURL !== "")
      db.prepare("UPDATE users SET photoURL = ? WHERE id = ?").run(photoURL, id);
    if (bgPhotoURL !== "")
      db.prepare("UPDATE users SET bgPhotoURL = ? WHERE id = ?").run(bgPhotoURL, id);
    db.prepare("UPDATE users SET profileVisibility = ? WHERE id = ?").run(profileVisibility === true ? 1 : 0, id);
    db.prepare("UPDATE users SET showNotifications = ? WHERE id = ?").run(showNotifications === true ? 1 : 0, id);
    if (bio !== "")
      db.prepare("UPDATE users SET bio = ? WHERE id = ?").run(bio, id);
    if (password !== "" || newpassword !== "" || cnewpassword !== "")
    {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
      if (!user) {
        reply.status(401).send({ error: "Invalid user id", code: "INVALID_USER_ID" });
        return ;
      }
      const match = await bcrypt.compare(password, user.password as string);
      if (!match) {
        reply.status(401).send({ error: "Invalid current password", code: "INVALID_PASSWORD" });
        return ;
      }
      console.log("Current password verified for user id:", newpassword);
      if (!strongPassword.test(newpassword))
      {
        reply.status(400).send({ error: "Min 8 chars, 1 uppercase, 1 number, 1 symbol", code: "PASSWORD_NOT_STRONG"})
        return ;
      }
      if (newpassword !== cnewpassword) {
        reply.status(400).send({ error: "New passwords do not match", code: "CPASSWORD_NOT_MATCHING" });
        return ;
      }
      const hashedPassword = await bcrypt.hash(newpassword, 10);
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, id);
    }
    const pending = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User;
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User;
    const message : UserEvent = {
      userId: String(row.id),
      name: row.name,
      email: row.email,
      photoURL: row.photoURL || "",
      bgPhotoURL: row.bgPhotoURL || "",
      bio: row.bio || "",
      profileVisibility: row.profileVisibility || true,
      showNotifications: row.showNotifications || true
    }
    kafkaProducerService.publishUserUpdated(message);
    reply.status(201).send({ 
      message: "User data updated successfully",
      code: "USER_DATA_UPDATED_SUCCESS" });
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

app.post("/api/v1/auth/profile/getProfileUser", async (request, reply) => {
  try {
    const { id } = (request.body as {id: number});
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
    if (!user) {
      reply.status(401).send({ error: "Invalid user id", code: "INVALID_USER_ID" });
      return ;
    }
    const userInfo = {
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      bgPhotoURL: user.bgPhotoURL,
      bio: user.bio
    }
    reply.status(201).send({ 
      message: "User data fetched successfully",
      user: userInfo,
      code: "USER_DATA_FETCHED_SUCCESS" });
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: "Internal server error" });
  }
});

app.get("/api/v1/auth/protect", async (request, reply) => {
    return reply.send({message: "Protected route accessed", user: request.user});
});

app.post("/api/v1/auth/logout", async (request, reply) => {
  try {
    // Clear the refresh token cookie
    reply.clearCookie("refreshToken", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
    
    return reply.send({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return reply.status(500).send({ error: "Logout failed" });
  }
});

// app.post ("/auth/v1/verify-email", async (request, reply) => {
//   try {
//     const { otp } = request.body as { otp: string };
    
//     if (!otp) {
//       return reply.status(400).send({ error: "OTP is required" });
//     }

//   }
// });

// app.get("/kafka", async (request, reply) => {
//   await consumer.start(async (message) => {
//     switch (message.value.event) {
//       case "USER_CREATED":
//         console.log("✅ User created event received:", message.value.user);
//         break;
  
//       case "USER_UPDATED":
//         console.log("✅ User updated:", message.value.user);
//         break;
  
//       default:
//         console.log("⚠️ Unknown event:", message.value);
//     }
//   });
// });

app.listen({ port: 3004, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});

await kafkaProducerService.connect();

// app.post("/api/v1/auth/profile/getProfileUser", async (request, reply) => {
//   try {
//     const { id } = (request.body as {id: number});
//     const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
//     if (!user) {
//       reply.status(401).send({ error: "Invalid user id", code: "INVALID_USER_ID" });
//       return ;
//     }
//     const userInfo = {
//       name: user.name,
//       email: user.email,
//       photoURL: user.photoURL,
//       bgPhotoURL: user.bgPhotoURL,
//       bio: user.bio
//     }
//     reply.status(201).send({ 
//       message: "User data fetched successfully",
//       user: userInfo,
//       code: "USER_DATA_FETCHED_SUCCESS" });
//   } catch (err) {
//     console.error(err);
//     reply.status(500).send({ error: "Internal server error" });
//   }
// });


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

kafkaProducerService.connect();