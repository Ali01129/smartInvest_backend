import express, { Request, Response } from 'express';
import Wallet from '../models/wallet';
import User from '../models/user';
import Transaction from '../models/transaction';
const stripe=require('stripe')("sk_test_51PhaFTKzthS38P3srMe3lxN7uS9SM5cMhQR6lTq0T8vpjwYDNK0JPkbFtxwl2zyix6yiXam8nOLBg4FOGaXLsm5y00zxFnqqq2");


interface AuthenticatedRequest extends Request {
    user?: any;
}

class walletController{

    //get request
    //wallet information
    public async info(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const user = req.user;
        try {
            const wallet = await Wallet.findOne({ userId: user.id });
            if (!wallet) {
                return res.status(404).send({ status: 'error', message: 'Wallet not found' });
            }
            return res.status(200).send({ status: 'success', wallet });
        } catch (error) {
            console.error('Error fetching wallet info:', error);
            return res.status(500).send({ status: 'error', message: 'Internal server error' });
        }
    }   
    //get request
    //show all the data
    public async all(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const user = req.user;
        try {
            const wallet = await Wallet.findOne({ userId: user.id });
            const userData = await User.findOne({ _id: user.id });
            const transactions = await Transaction.find({ $or: [{ senderId: user.id }, { receiverId: user.id }] });
            
            const selectedTransactions = transactions.map(transaction => ({
                type: transaction.senderId === user.id ? 'sent' : 'received',
                amount: transaction.amount,
                date: transaction.createdAt,
                name: transaction.senderId === user.id ? transaction.receiverName : transaction.senderName,
            }));
    
            const newTransactions = selectedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
            return res.status(200).send({ status: 'success', name:userData?.username,usd:wallet?.usd,sc:wallet?.smartCoin,transactions:newTransactions });
        } catch (error) {
            console.error('Error fetching wallets:', error);
            return res.status(500).send({ status: 'error', message: 'Internal server error' });
        }
    }

    //post request
    //stripe
    public async stripe(req: Request, res: Response): Promise<Response> {
        try{
            const paymentIntent = await stripe.paymentIntents.create({
                amount: req.body.amount * 100,
                currency: 'usd',
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            return res.status(200).send({ status: 'success', client_secret: paymentIntent.client_secret });
        }
        catch(e:any){
            return res.status(400).send({ status: 'error', message: e.message });
        }
    }
}
export default new walletController();