import BoHrOnboarding from './bohr-onboarding.es';
import Web3 from 'web3'
import { addressEncode,addressDecode16 } from "./mixins/mixin";
import { ajaxMethod } from "./mixins/request";

import { ethers } from 'ethers';
import {
  hstBytecode,
  hstAbi,
  piggybankBytecode,
  piggybankAbi,
} from './constants.json';

let ethersProvider;
let hstFactory;
let piggybankFactory;
const baseApiUrl = "https://mainnetapi.bohrchain.com/v2.4.0/";
const currentUrl = new URL(window.location.href);
const forwarderOrigin =
  currentUrl.hostname === 'localhost' ? 'http://localhost:9010' : undefined;

const { isBoHrInstalled } = BoHrOnboarding;

// Dapp Status Section
const networkDiv = document.getElementById('network');
const chainIdDiv = document.getElementById('chainId');
const accountsDiv = document.getElementById('accounts');

// Basic Actions Section
const onboardButton = document.getElementById('connectButton');
const getAccountsButton = document.getElementById('getAccounts');
const getAccountsResults = document.getElementById('getAccountsResult');


// Contract Section
const deployButton = document.getElementById('deployButton');
const depositButton = document.getElementById('depositButton');
const withdrawButton = document.getElementById('withdrawButton');
const contractStatus = document.getElementById('contractStatus');


// Send Eth Section
const sendButton = document.getElementById('sendButton');
const sendEIP1559Button = document.getElementById('sendEIP1559Button');

// Send Tokens Section
const tokensStatus = document.getElementById('tokensStatus');
const tokenAddress = document.getElementById('tokenAddress');
const createToken = document.getElementById('createToken');
const initialAmount = document.getElementById('initialAmount');
const tokenName = document.getElementById('tokenName');
const decimalUnits = document.getElementById('decimalUnits');
const tokenSymbol = document.getElementById('tokenSymbol');
const watchAsset = document.getElementById('watchAsset');
const transferTokens = document.getElementById('transferTokens');
const approveTokens = document.getElementById('approveTokens');
const transferTokensWithoutGas = document.getElementById(
  'transferTokensWithoutGas',
);
const approveTokensWithoutGas = document.getElementById(
  'approveTokensWithoutGas',
);



const toastWarp = document.getElementById("toastWarp");
const showToast = document.getElementById("showToast");
const showTips = document.getElementById("showTips");
const sendNum = document.getElementById("sendNum");
const sendAddress = document.getElementById("sendAddress");

const clickShowToast = (msg) => {
 showToast.innerHTML = msg;
 toastWarp.style.display = 'block';
};
toastWarp.onclick = async () => {
  toastWarp.style.display = 'none';
}
const clickShowTips = (msg) => {
  showTips.innerHTML = msg;
  showTips.style.display = 'block';
  setTimeout( function () {
    showTips.style.display = 'none';
  },1000);
};

const getData = (url,data,method) => {
  ajaxMethod(url,data,method).then(res => {
        return res;
  });
}

// Miscellaneous

const initialize = async () => {
  try {

    // We must specify the network as 'any' for ethers to allow network changes
    ethersProvider = new ethers.providers.Web3Provider(window.bohrWeb, 'any');
    hstFactory = new ethers.ContractFactory(
      hstAbi,
      hstBytecode,
      ethersProvider.getSigner(),
    );
    piggybankFactory = new ethers.ContractFactory(
      piggybankAbi,
      piggybankBytecode,
      ethersProvider.getSigner(),
    );
  } catch (error) {
    console.error(error);
  }

  let onboarding;
  try {
    onboarding = new BoHrOnboarding({ forwarderOrigin });
  } catch (error) {
    console.error(error);
  }

  let accounts;
  let accountButtonsInitialized = false;

  const accountButtons = [
    deployButton,
    depositButton,
    withdrawButton,
    sendButton,
    createToken,
    watchAsset,
    transferTokens,
    approveTokens,
    transferTokensWithoutGas,
    approveTokensWithoutGas,
  ];

  const isBoHrConnected = () => accounts && accounts.length > 0;

  const onClickInstall = () => {
    onboardButton.innerText = 'Onboarding in progress';
    onboardButton.disabled = true;
    onboarding.startOnboarding();
  };

  const onClickConnect = async () => {
    try {
      const newAccounts = await bohrWeb.request({
        method: 'eth_requestAccounts',
      });
      handleNewAccounts(newAccounts);
    } catch (error) {
      console.error(error);
    }
  };

  const clearTextDisplays = () => {
  };

  const updateButtons = () => {
    const accountButtonsDisabled =
      !isBoHrInstalled() || !isBoHrConnected();
    if (accountButtonsDisabled) {
      for (const button of accountButtons) {
        button.disabled = true;
      }
      clearTextDisplays();
    } else {
      deployButton.disabled = false;
      sendButton.disabled = false;
      createToken.disabled = false;
    }

    if (isBoHrInstalled()) {
    } else {
      onboardButton.innerText = 'Click here to install BoHr!';
      onboardButton.onclick = onClickInstall;
      onboardButton.disabled = false;
    }

    if (isBoHrConnected()) {
      onboardButton.innerText = 'Connected';
      onboardButton.disabled = true;
      if (onboarding) {
        onboarding.stopOnboarding();
      }
    } else {
      onboardButton.innerText = 'Connect';
      onboardButton.onclick = onClickConnect;
      onboardButton.disabled = false;
    }
  };


  const initializeAccountButtons = () => {
    if (accountButtonsInitialized) {
      return;
    }
    accountButtonsInitialized = true;

    /**
     * Contract Interactions
     */

    deployButton.onclick = async () => {
      let contract;
      contractStatus.innerHTML = 'Deploying';



      try {
        contract = await piggybankFactory.deploy();
        console.log("contract:"+JSON.stringify(contract));

        // let deployTransaction = await contract.deployTransaction.wait();
        setTimeout(async function () {
           // await
           contract.deployTransaction.wait();
        },10);

      } catch (error) {
        console.log("error:"+JSON.stringify(error));
        contractStatus.innerHTML = 'Deployment Failed';
        throw error;
      }



      console.log(
        `Contract mined!  transactionHash: ${contract.deployTransaction.transactionHash}`,
      );

      //sleep for transaction-result
      sleep(10000);

      const contractDeployResult = await ajaxMethod(baseApiUrl+'transaction-result', {hash:contract.deployTransaction.transactionHash},'get')
      const contractDeployInfo = JSON.parse(contractDeployResult);
      const HTCROSS_CONTRACT_ADDRESS = contractDeployInfo.result.contractAddress;
      const contractNew =  getContract(piggybankAbi,HTCROSS_CONTRACT_ADDRESS);
      console.log(
          `Contract mined! address: ${HTCROSS_CONTRACT_ADDRESS} `,
      );

      contractStatus.innerHTML = 'Deployed';
      depositButton.disabled = false;
      withdrawButton.disabled = false;

      depositButton.onclick = async () => {
        contractStatus.innerHTML = 'Deposit initiated';

        // const result = await contract.deposit({
        //   from: accounts[0],
        //   value: '0x3782dace9d900000',
        // });
        // console.log(result);

        contractNew.methods.deposit().send({from: accounts[0],value: '0x82dace9d900000' , gasLimit: 60000,
          gasPrice: '20000000000'})
           .on('transactionHash', function(hash){
              console.log("transactionHash:"+hash);
              contractStatus.innerHTML = 'Deposit completed,transactionHash:<a target="_blank" href="'+baseApiUrl+'transaction-result?hash='+hash+'">'+hash+'</a>';
            }).on('error' , function(error, errdata){
              console.log("error:"+error);
            })

      };

      withdrawButton.onclick = async () => {
        // const result = await contract.withdraw('0xde0b6b3a7640000', {
        //   from: accounts[0],
        // });
        // console.log(result);

        contractStatus.innerHTML = 'Withdrawn initiated';
        contractNew.methods.withdraw('0x6b3a7640000').send({from: accounts[0] , gasLimit: 60000,
          gasPrice: '20000000000' })
           .on('transactionHash', function(hash){
              console.log("transactionHash:"+hash);
              contractStatus.innerHTML = 'Withdrawn completed,transactionHash:<a target="_blank" href="'+baseApiUrl+'transaction-result?hash='+hash+'">'+hash+'</a>';
            }).on('error' , function(error, errdata){
          console.log("error:"+error);
        })

      };


    };

    /**
     * Sending ETH
     */

    sendButton.onclick = async () => {

      if(sendNum.value <= 0) {
        clickShowTips('Please input Amount');
        return;
      }
     if(sendAddress.value.length !== 42 && sendAddress.value.substring(0,2) !== '0x'  ) {
       clickShowTips('Please input Address');
        return;
      }
      const sendValue = '0x'+(parseInt(parseFloat(sendNum.value)*1e18) ).toString(16);
      console.log(sendValue)
      const result = await ethersProvider.getSigner().sendTransaction({
       to: sendAddress.value,
        value: sendValue,
        gasLimit: 21000,
        gasPrice: 20000000000,
      });
      console.log(result);
    };

    sendEIP1559Button.onclick = async () => {
      const result = await bohrWeb.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: accounts[0],
            to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            value: '0x0002241af62c0000',
            gasLimit: '0x5028',
            maxFeePerGas: '0x2540be400',
            maxPriorityFeePerGas: '0x3b9aca00',
          },
        ],
      });
      console.log(result);
    };


    /**
     * ERC20 Token
     */
     initialAmount.onfocus = function() {
       initialAmount.style.border = '1px solid #4e4e4e';
     }
     decimalUnits.onfocus = function() {
       decimalUnits.style.border = '1px solid #4e4e4e';
     }

    createToken.onclick = async () => {


      if (tokenName.value == null || tokenName.value == '') {
        tokenName.style.border = '1px solid red';
        return;
      }else{
        tokenName.style.border = '';
      }
      if (isNaN(parseInt(decimalUnits.value) ) || parseInt(decimalUnits.value) < 3 || parseInt(decimalUnits.value) > 18) {
        decimalUnits.style.border = '1px solid red';
        return;
      }else{
        decimalUnits.style.border = '';
      }
      if (tokenSymbol.value == null || tokenSymbol.value == '') {
        tokenSymbol.style.border = '1px solid red';
        return;
      }else{
        tokenSymbol.style.border = '';
      }

      const _initialAmount = '1';
      const _tokenName = tokenName.value;
      const _decimalUnits = parseInt(decimalUnits.value) ;
      const _tokenSymbol = tokenSymbol.value;



      try {
        let contract = await hstFactory.deploy(
          _initialAmount,
          _tokenName,
          _decimalUnits,
          _tokenSymbol,
        );

        setTimeout(function () {
           // await
           contract.deployTransaction.wait();
        },10);

        console.log(
            `Contract mined!  transactionHash: ${contract.deployTransaction.hash}`,
        );

        //sleep for transaction-result
        sleep(10000);


        const contractDeployResult = await ajaxMethod(baseApiUrl+'transaction-result', {hash:contract.deployTransaction.hash},'get')
        const contractDeployInfo = JSON.parse(contractDeployResult);
        const contractAddress = contractDeployInfo.result.contractAddress;
        const contractNew =  getContract(hstAbi,contractAddress);
        console.log(
            `Contract mined! address: ${contractAddress} `,
        );

        // contract.deployTransaction = null;

        if (contractNew.address === undefined) {
          return undefined;
        }

     //   contract.address = "0x1b71faa4fe79b69cd9c6ee373fc1f52cee6482fa";


        tokenAddress.innerHTML = contractAddress;
        watchAsset.disabled = false;
        transferTokens.disabled = false;
        approveTokens.disabled = false;
        transferTokensWithoutGas.disabled = false;
        approveTokensWithoutGas.disabled = false;

        watchAsset.onclick = async () => {
          const result = await bohrWeb.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: contractAddress,
                symbol: _tokenSymbol,
                decimals: _decimalUnits,
                image: 'https://bohrweb.org/bohr_erc.svg',
              },
            },
          });
          console.log('result', result);
        };

        transferTokens.onclick = async () => {
          const result = await contractNew.methods.transfer(
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            '150').send(
            {
              from: accounts[0],
              gasLimit: 60000,
              gasPrice: '20000000000',
            })
              .on('transactionHash', function(hash){
                console.log("transactionHash:"+hash);
                tokensStatus.innerHTML = 'transfer completed,transactionHash:<a target="_blank" href="'+baseApiUrl+'transaction-result?hash='+hash+'">'+hash+'</a>';

              }).on('error' , function(error, errdata){
                console.log("error:"+error);
              })

        };

        approveTokens.onclick = async () => {
          contractNew.methods.approve(contractAddress, '60000').send({
            from: accounts[0],
                      gasLimit: 60000,
                      gasPrice: '20000000000',
                      })
              .on('transactionHash', function(hash){
                  console.log("transactionHash:"+hash);
                  tokensStatus.innerHTML = 'approve completed,transactionHash:<a target="_blank" href="'+baseApiUrl+'transaction-result?hash='+hash+'">'+hash+'</a>';

                }).on('error' , function(error, errdata){
              console.log("error:"+error);
            })

        };

        transferTokensWithoutGas.onclick = async () => {

          const result = await contractNew.methods.transfer(
              '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
              '150').send(
              {
                from: accounts[0]
              })
              .on('transactionHash', function(hash){
                console.log("transactionHash:"+hash);
                tokensStatus.innerHTML = 'transfer completed,transactionHash:<a target="_blank" href="'+baseApiUrl+'transaction-result?hash='+hash+'">'+hash+'</a>';

              }).on('error' , function(error, errdata){
                console.log("error:"+error);
              })

        };

        approveTokensWithoutGas.onclick = async () => {
          contractNew.methods.approve(contractAddress, '60000').send({
            from: accounts[0]
          })
              .on('transactionHash', function(hash){
                console.log("transactionHash:"+hash);
                tokensStatus.innerHTML = 'approve completed,transactionHash:<a target="_blank" href="'+baseApiUrl+'transaction-result?hash='+hash+'">'+hash+'</a>';

              }).on('error' , function(error, errdata){
            console.log("error:"+error);
          })
        };

        return contract;
      } catch (error) {
        tokenAddress.innerHTML = 'Creation Failed';
        throw error;
      }
    };

    getAccountsButton.onclick = async () => {
      try {
        const _accounts = await bohrWeb.request({
          method: 'eth_accounts',
        });
        console.log('_accounts------', _accounts);
        getAccountsResults.innerHTML =
          addressEncode(_accounts[0])+","+JSON.stringify(_accounts) || 'Not able to get accounts';
      } catch (err) {
        console.error(err);
        getAccountsResults.innerHTML = `Error: ${err.message}`;
      }
    };



  };



  function handleNewAccounts(newAccounts) {
    accounts = newAccounts;
    console.log("accounts???",accounts);
    accountsDiv.innerHTML = accounts == '' || accounts == null || accounts == undefined ? accounts : addressEncode(accounts[0]);
    if (isBoHrConnected()) {
      initializeAccountButtons();
    }
    updateButtons();
  }

  function handleNewChain(chainId) {
    chainIdDiv.innerHTML = chainId;
  }

  function handleEIP1559Support(supported) {
    if (supported && Array.isArray(accounts) && accounts.length >= 1) {
      sendEIP1559Button.disabled = false;
      sendEIP1559Button.hidden = false;
      sendButton.innerText = 'Send Legacy Transaction';
    } else {
      sendEIP1559Button.disabled = true;
      sendEIP1559Button.hidden = true;
      sendButton.innerText = 'Send';
    }
  }

  function handleNewNetwork(networkId) {
    networkDiv.innerHTML = networkId;
  }

  async function getNetworkAndChainId() {
    try {
      const chainId = await bohrWeb.request({
        method: 'eth_chainId',
      });
      handleNewChain(chainId);

      const networkId = await bohrWeb.request({
        method: 'net_version',
      });
      handleNewNetwork(networkId);

      const block = await bohrWeb.request({
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
      });

    } catch (err) {
      console.error(err);
    }
  }

  updateButtons();

  if (isBoHrInstalled()) {
    bohrWeb.autoRefreshOnNetworkChange = false;
    getNetworkAndChainId();

    bohrWeb.autoRefreshOnNetworkChange = false;
    getNetworkAndChainId();

    bohrWeb.on('chainChanged', (chain) => {
      handleNewChain(chain);
      bohrWeb
        .request({
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
        })
        .then((block) => {
        });
    });
    bohrWeb.on('networkChanged', handleNewNetwork);
    bohrWeb.on('accountsChanged', (newAccounts) => {
      bohrWeb
        .request({
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
        })
        .then((block) => {
          handleEIP1559Support(block.baseFeePerGas !== undefined);
        });
      handleNewAccounts(newAccounts);
    });

    try {
      const newAccounts = await bohrWeb.request({
        method: 'eth_accounts',
      });
      handleNewAccounts(newAccounts);
    } catch (err) {
      console.error('Error on init when getting accounts', err);
    }
  }
};

window.addEventListener('DOMContentLoaded', initialize);

// utils

function getPermissionsDisplayString(permissionsArray) {
  if (permissionsArray.length === 0) {
    return 'No permissions found.';
  }
  const permissionNames = permissionsArray.map((perm) => perm.parentCapability);
  return permissionNames
    .reduce((acc, name) => `${acc}${name}, `, '')
    .replace(/, $/u, '');
}

function stringifiableToHex(value) {
  return ethers.utils.hexlify(Buffer.from(JSON.stringify(value)));
}
function getContract(abi,contractAddress) {
  if (window.bohrWeb) {
    window.web3 = new Web3(window.bohrWeb)
  }else if(window.web3) {
    window.web3 = new Web3((window.web3).currentProvider)
  }
  const contractFun = (window.web3).eth.Contract;

  return  new contractFun(abi,contractAddress);
}

function sleep(delay) {
  var start = (new Date()).getTime();
  while((new Date()).getTime() - start < delay) {
    continue;
  }
}
