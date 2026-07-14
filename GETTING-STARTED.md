# Getting Started (in plain language)

Hi! This guide explains your new backend without any coding words. 🙂

## What is a "backend"?

Think of your business as a **shop**:

- The **shop floor** = the website you already built. Buttons, screens, colours.
  This is what customers see and touch.
- The **back room** = this project. It's where all the *real* stuff is kept:
  the list of customers, every order, every payment, and the locked drawer of
  passwords. Customers never see the back room, but nothing works without it.

I built the back room. It's ready and tested.

## What can it do right now?

- ✅ Log in customers using their phone + a one-time code (like your bank sends).
- ✅ Log in your sales reps and back-office staff with an id and password.
- ✅ Show the product catalogue (currently sample products — see below).
- ✅ Save shopping carts.
- ✅ Take orders, add 3% GST, work out courier charge, set the dispatch date.
- ✅ Record payments and show a company UPI QR code to pay.
- ✅ Handle "request a quote" with the ₹10,000 minimum.
- ✅ Run the "Mira" AI helper and send shipping updates to customers.

I tested every one of these and they all work.

## Two things to know

**1. The product prices are just samples for now.**
The real prices live inside your website's design files (a file called
`app/data.jsx`). I don't have that file yet. When you give it to me, I'll copy
the exact products and prices in so the back room matches your shop floor
perfectly. Until then it uses made-up sample products so we could test.

**2. Text messages are in "practice mode".**
When testing, the login code is *not* actually texted — it's just written down
in the system log so we can try it. Before real customers use it, we connect a
text-message company (like MSG91 or Twilio). That's a small, quick step later.

## What I need from you next

To finish connecting the back room to your shop floor, I need the **website
files** that are currently saved in Claude design. Those files tell me the exact
names of every button and field, so I can wire each one to the right drawer.

When you're ready, the easiest way is to **put those files into this same
project** (or upload them to me here) and I'll do the wiring.

## Want to see it running yourself? (optional)

You'd need a helper program called Node.js on your computer. Then, in a terminal:

```
npm install
npm run setup
npm run dev
```

Then open `http://localhost:4000/health` in your browser. If you see
`{"ok":true}`, the back room is running. Don't worry if this feels technical —
I can run and test it for you anytime; just ask.

## Test logins (for trying it out)

- **Back office:** id `office`, password `office123`
- **Sales rep:** id `REP001`, password `rep123`

(We'll change these to real, secure ones before going live.)
