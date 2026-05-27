const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const app = express();
app.use(cors());

app.use(bodyParser.json());
app.use(express.static(__dirname));

const adapter = new JSONFile("db.json");

const db = new Low(adapter, {
users: [],
withdraws: []
});

async function start(){

await db.read();

app.post("/signup", async (req,res)=>{

const {
username,
password,
referral
} = req.body;

const userExists =
db.data.users.find(
u => u.username === username
);

if(userExists){

return res.send(
"User already exists"
);
}

let balance = 100;

if(referral){

const refUser =
db.data.users.find(
u => u.username === referral
);

if(refUser){

refUser.balance += 50;

balance += 50;
}
}

db.data.users.push({
username,
password,
balance,
referral
});

await db.write();

res.send(
"Signup successful"
);
});

app.post("/login", async (req,res)=>{

const {
username,
password
} = req.body;

const user =
db.data.users.find(
u =>
u.username === username &&
u.password === password
);

if(user){

res.json({
success:true,
username:user.username,
balance:user.balance
});

}else{

res.json({
success:false
});
}
});

app.get("/user/:username", async (req,res)=>{

const user =
db.data.users.find(
u => u.username ===
req.params.username
);

if(user){

res.json(user);

}else{

res.send("User not found");
}
});

app.post("/daily-reward", async (req,res)=>{

const { username } = req.body;

const user =
db.data.users.find(
u => u.username === username
);

if(!user){

return res.send(
"User not found"
);
}

user.balance += 10;

await db.write();

res.json({
success:true,
balance:user.balance
});
});

app.post("/spin", async (req,res)=>{

const { username } = req.body;

const user =
db.data.users.find(
u => u.username === username
);

if(!user){

return res.send(
"User not found"
);
}

const rewards =
[5,10,20,50];

const randomReward =
rewards[
Math.floor(
Math.random() *
rewards.length
)
];

user.balance += randomReward;

await db.write();

res.json({
success:true,
reward:randomReward,
balance:user.balance
});
});

app.post("/withdraw", async (req,res)=>{

const {
username,
amount,
upi
} = req.body;

const user =
db.data.users.find(
u => u.username === username
);

if(!user){

return res.send(
"User not found"
);
}

if(user.balance < amount){

return res.send(
"Insufficient Balance"
);
}

user.balance -= amount;

db.data.withdraws.push({
username,
amount,
upi,
status:"Pending"
});

await db.write();

res.send(
"Withdraw Request Submitted"
);
});

app.get("/admin/users", async (req,res)=>{

res.json(
db.data.users
);
});

app.get("/admin/withdraws", async (req,res)=>{

res.json(
db.data.withdraws
);
});

const PORT =
process.env.PORT || 3000;

app.listen(PORT, ()=>{

console.log(
"Server running on port " + PORT
);
});

}

start();
