const ZXSwapQuoter =  require('@0x/asset-swapper');
const ZX = require('0x.js');
const Providers = require('@0x/subproviders');
const ZUtils = require('@0x/utils');
require('dotenv').config();

const provider = new ZX.Web3ProviderEngine();
const privateKeyProvider = new Providers.PrivateKeyWalletSubprovider(process.env.PRIVATE_KEY);
const rpcProvider = new Providers.RPCSubprovider(process.env.INFURA_RPC);

provider.addProvider(privateKeyProvider);
provider.addProvider(rpcProvider);
ZUtils.providerUtils.startProviderEngine(provider);


const NetworkId = Number(process.env.NETWORK_ID);

// web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
/**
 * 
 * @param {string} amount Pass string to avoid precision issues
 * @param {Boolean} isBuy Set to true if it is a buy 
 * @param {String} baseTokenAddress Base Token address, for instance VSF
 * @param {String} quoteTokenAddress Quote Token address, for instance WETH or DAI
 */
const quote = async (amount, isBuy, baseTokenAdress, quoteTokenAddress) => {

   const apiUrl = 'https://veridex.herokuapp.com/v2/';
   //  const apiUrl = 'http://localhost:3000/v2/';
 
    let makerTokenAddress = baseTokenAdress || '0xba3a79d758f19efe588247388754b8e4d6edda81'; // VSF token on Ropsten
    let takerTokenAddress = quoteTokenAddress || '0xc778417e063141139fce010982780140aa0cd5ab'; // WETh token on Ropsten

    // buy amount on token units. Example buy 10 VSF => 10*10**18
    const tokenAmount = ZXSwapQuoter.BigNumber(amount);
    console.log(tokenAmount.toString());
    const swapQuoter = ZXSwapQuoter.SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(provider, apiUrl, {networkId:NetworkId});
    let quote;
    let error;
    // Requesting a quote for buying 10 units of makerToken
    if(isBuy){
        try{
        quote = await swapQuoter.getMarketBuySwapQuoteAsync(
            makerTokenAddress,
            takerTokenAddress,
            tokenAmount,
            );
        }catch(e){
            error = e;
        }
      }else{
        try{
        quote = await swapQuoter.getMarketSellSwapQuoteAsync(
            takerTokenAddress,
            makerTokenAddress,
            tokenAmount,
            );
        }catch(e){
            error = e;
        }
      }
      if(error){
        console.log(error);
      }else{
        console.log(quote);
        let prices;
        let amount_taker_units;
        if(quote.orders.length > 0){
           prices = quote.orders.map((o)=>{
            const makerAssetAmountInUnits = new ZXSwapQuoter.BigNumber(o.makerAssetAmount);
            const takerAssetAmountInUnits = new ZXSwapQuoter.BigNumber(o.takerAssetAmount);
            return  isBuy
                    ? takerAssetAmountInUnits.div(makerAssetAmountInUnits)
                    : makerAssetAmountInUnits.div(takerAssetAmountInUnits);
           });
           amount_taker_units = quote.orders.map((o)=>{    
            return  o.remainingFillableTakerAssetAmount;
           });


           prices = quote.orders.map((o)=>{
            const makerAssetAmountInUnits = new ZXSwapQuoter.BigNumber(o.makerAssetAmount);
            const takerAssetAmountInUnits = new ZXSwapQuoter.BigNumber(o.takerAssetAmount);
            return  isBuy
                    ? takerAssetAmountInUnits.div(makerAssetAmountInUnits)
                    : makerAssetAmountInUnits.div(takerAssetAmountInUnits);
           });
           const sum_prices = prices.reduce((t,c)=>{
            return t.plus(c)
           })
           const total_amount_taker_units = amount_taker_units.reduce((t,c)=>{
            return t.plus(c)
           })
           const price_avg = sum_prices.div(new ZXSwapQuoter.BigNumber(prices.length)).toString();
           console.log('price average');
           console.log(price_avg)
           console.log('Total Amount To ');
           // use decimals from taker token
           console.log(total_amount_taker_units.toString());


        }
      }
      provider.stop();

    

}

let baseTokenAddress =  '0xba3a79d758f19efe588247388754b8e4d6edda81'; // VSF token on Ropsten
let quoteTokenAddress =  '0xc778417e063141139fce010982780140aa0cd5ab'; // WETh token on Ropsten

// quote 10 VSF to sell
quote(10*10**18, false, baseTokenAddress, quoteTokenAddress );

// quote 10 VSF to buy
quote(10*10**18, false, baseTokenAddress, quoteTokenAddress);