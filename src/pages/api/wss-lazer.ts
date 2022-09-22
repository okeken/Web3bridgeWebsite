import type { NextApiRequest, NextApiResponse } from "next";
import  { createRouter }  from "next-connect";
import connectDB, { closeDB } from "@server/config/database";
import web3UserDb from "@server/models/cohortUsers";
import web2UserDb from "@server/models/web2";
import { sendEmail } from "@server/mailer";
import {PaymentStatus, Tracks} from "enums"
import { verifyPaymentSchema } from 'schema';
import {ISmsData} from "types"
import { sendSms } from "@server/sms";
import validate from "@server/validate";
import {webPayment} from "@server/config"
import LazerPay from "lazerpay-node-sdk";


const router = createRouter<NextApiRequest, NextApiResponse>();
// const paystack = Paystack(process.env.PAYMENT_SECRET);
const lazerpay = new LazerPay(process.env.LAZERPAY_PUBLIC_KEY as string, process.env.LAZERPAY_SECRET_KEY as string);

router

// verify payment
.post(async (req: NextApiRequest, res: NextApiResponse) => {
    const {reference, amountReceived, status, metadata:{track=""}={}, customer:{email=''}={} } = req.body
    let userDb;
  if(!track){
    return res.status(404).json({
      status: false,
      message: "track not found"
    })
  }

  if(!email){
    return res.status(423).json({
      status: false,
      message: "email not found"
    })
  }
  
  if(amountReceived !== webPayment.USD){
    return res.status(423).json({
      status: false,
      message: `Amount received is not valid, expected ${webPayment.USD}`,
    })
  }

  if(status !== "confirmed"){
   
    return res.status(423).json({
      status: false,
      message: "payment not valid",
    })
  }

await connectDB();
if(track===Tracks.web2){
    userDb = web2UserDb
    
}

if(track===Tracks.web3){
    userDb = web3UserDb
}
      try{
  // user details
const userDetails = await userDb.findOne({ email });
// check if user exists
if(!userDetails){
  await closeDB();
    return res.status(404).json({
        status: false,
        message: "user not found"
    })
}

// check if payment is already successful
if(userDetails.paymentStatus === PaymentStatus.success){
  await closeDB();
    return res.status(423).json({
        status: false,
        message: "payment already successful"
    })
}

// verify payment

const payload = {
  identifier: reference,
};
const {data} = await lazerpay.Payment.confirmPayment(payload);

if(data.status !== "confirmed" && data.amountReceived !== webPayment.USD){
  await closeDB();
  return res.status(423).json({
    status: false,
    message: "payment not valid",
  })
}

// update payment status

      // update user payment status
        const [,sms={balance:""} as ISmsData] =  await Promise.all<any>([
          userDb.updateOne({email}, {
              $set: {paymentStatus: PaymentStatus.success}
          }),
         
      sendSms({recipients:userDetails.phone}), 
      sendEmail({email, name:userDetails.name, type:userDetails.currentTrack, file:userDetails.currentTrack==='web2'? 'web2': 'web3',
    }),
        ])
     
        if(++sms.balance <= 100 ){
          sendSms({recipients:["2348130192777"], message:`low balance, ${++sms.balance-2} sms balance left`})
        }

        await closeDB();
   return res.status(200).json({
        status: true,
        message: "payment successful",
        data:req.body
   })

      }
      catch(error){
        console.log('error lazer', error)
        return res.status(500).json({
          status: false,
          message: "Server Error",
        })
      }

});



export default router.handler({
  // @ts-ignore
  onError: (err, req, res, next) => {
    console.log("something went wrong", err);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
});
