require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const HF_KEY = process.env.HF_KEY;
if(!HF_KEY){
  console.warn('Warning: HF_KEY is not set. Set HF_KEY in .env before starting the proxy.');
}

const app = express();
app.use(helmet());
app.use(express.json({limit: '50kb'}));
app.use(cors());

const limiter = rateLimit({ windowMs: 60*1000, max: 30 });
app.use(limiter);

app.post('/api/infer', async (req, res) => {
  try{
    const { model, inputs } = req.body;
    if(!model || !inputs) return res.status(400).json({error: 'Missing model or inputs'});
    if(!HF_KEY) return res.status(500).json({error: 'Server not configured with HF_KEY'});

    const url = `https://api-inference.huggingface.co/models/${model}`;
    const hfRes = await axios.post(url, { inputs }, {
      headers: { Authorization: `Bearer ${HF_KEY}`, 'Content-Type': 'application/json' },
      timeout: 120000
    });

    return res.json(hfRes.data);
  }catch(err){
    console.error('Proxy error', err?.response?.data || err.message || err);
    const status = err?.response?.status || 500;
    const data = err?.response?.data || { error: err.message || 'Unknown error' };
    return res.status(status).json(data);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log(`Proxy server listening on http://localhost:${port} (POST /api/infer)`));
