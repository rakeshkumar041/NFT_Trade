const opensea  = require('opensea-js')
const HDWalletProvider = require("@truffle/hdwallet-provider")
require('dotenv').config()

const MNEMONIC = process.env.MNEMONIC
const INFURA_KEY = process.env.INFURA_KEY
const NETWORK = process.env.NETWORK
const API_KEY = process.env.API_KEY || "" // API key is optional but useful if you're doing a high volume of requests.

if (!MNEMONIC || !INFURA_KEY || !NETWORK) {
    console.error("Please set a mnemonic, infura key, owner, network, API key") 
}

const provider = new HDWalletProvider({
    mnemonic: MNEMONIC,
    providerOrUrl: 'https://' + NETWORK + '.infura.io/v3/' + INFURA_KEY,
    pollingInterval: 15000,
    chainId : 4
});

const openseaSDK = new opensea.OpenSeaPort(provider, {
  networkName: NETWORK === 'mainnet' ? opensea.Network.Main : opensea.Network.Rinkeby,
  apiKey: API_KEY
}, (arg) => console.log(arg))

//Get first address of metamask
console.log("account address1",provider.getAddress(0))
console.log("account address2",provider.getAddress(1))
const firstAddress = provider.getAddress(0)
const secondAddress = provider.getAddress(1)

const myArgs = process.argv.slice(2);

const tokenContractAddress = myArgs[0]
const targetPrice = myArgs[1]
const orderType = myArgs[2]
console.log('tokenAddress: ', tokenContractAddress);

async function main() {
    let asset;
    try {
        let { assets } = await openseaSDK.api.getAssets({
            asset_contract_address: tokenContractAddress,
            order_by : "sale_price",
            order_direction : "asc",
            limit : 1,
            offset : 0,
            include_orders : false,
        })
        asset = assets[0]
        console.log("--------------Asset-------------", asset);
    }  catch (error) {
        console.log(error);
    }

    if (orderType == "buy") {
        try {
            console.log("Bidding an item")
            const offer = await openseaSDK.createBuyOrder({
                asset: {
                tokenId : asset.tokenId,
                tokenAddress : tokenContractAddress
                //schemaName // WyvernSchemaName. If omitted, defaults to 'ERC721'. Other options include 'ERC20' and 'ERC1155'
                },
                firstAddress,
                // Value of the offer, in units of the payment token (or wrapped ETH if none is specified):
                startAmount: targetPrice,
            })
            console.log("offer Bid", offer)    
        } catch (error) {
            console.log(error);
            throw error;
        } 
    } else if(orderType == "sell") {
        console.log("Auctioning an item for a fixed price...")
        const fixedPriceSellOrder = await openseaSDK.createSellOrder({
            asset: {
                tokenId: asset.tokenId,
                tokenAddress: tokenContractAddress,
            },
            startAmount: targetPrice,
            accountAddress: firstAddress,
            endAmount: targetPrice,
        })
        console.log("fixedPriceSellOrder", fixedPriceSellOrder)
    }

    provider.engine.stop();
}

main()
