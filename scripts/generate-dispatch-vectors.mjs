import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(new URL('../backend/package.json',import.meta.url));
const { default:canonicalize } = await import(require.resolve('canonicalize'));
const { keccak256,toBytes } = await import(require.resolve('viem'));
const { privateKeyToAccount } = await import(require.resolve('viem/accounts'));
const signer = privateKeyToAccount('0x'+'1'.padStart(64,'0'));
const stranger = privateKeyToAccount('0x'+'2'.padStart(64,'0'));
const now = 1800000000;
const hash = value => keccak256(toBytes(canonicalize(value)));
const params = { wallet_address:'0x'+'3'.repeat(40), options:{ tokens:['USDT'],include_zero:false } };
const body = { v:1,chainId:1874,kind:'invoke',requestId:'synthetic-request-1',
  paymentId:'0x'+'4'.repeat(64),txHash:'0x'+'5'.repeat(64),params,paramsHash:hash(params),issuedAt:now-10,expiresAt:now+50 };
const sign = (body,account=signer) => account.signMessage({ message:{raw:hash(body)} });
const vectors = [];
const signature = await sign(body);
vectors.push({ name:'valid',body,signature,expectedValid:true });
vectors.push({ name:'canonical-key-order',body:{...body,params:{options:{include_zero:false,tokens:['USDT']},wallet_address:params.wallet_address}},signature,expectedValid:true });
const expired = {...body,issuedAt:now-61,expiresAt:now-1};
vectors.push({ name:'expired',body:expired,signature:await sign(expired),expectedValid:false });
vectors.push({ name:'wrong-signer',body,signature:await sign(body,stranger),expectedValid:false });
vectors.push({ name:'tampered-params',body:{...body,params:{...params,wallet_address:'0x'+'6'.repeat(40)}},signature,expectedValid:false });
const wrongHash = {...body,paramsHash:'0x'+'0'.repeat(64)};
vectors.push({ name:'wrong-paramsHash',body:wrongHash,signature:await sign(wrongHash),expectedValid:false });
writeFileSync(new URL('../docs/interfaces/dispatch-envelope.vectors.json',import.meta.url),JSON.stringify({
  description:'Synthetic interface fixtures, no receipt/payment/replay verification',now,expectedSigner:signer.address,vectors,
},null,2)+'\n');
console.log('Wrote six deterministic synthetic dispatch vectors.');
