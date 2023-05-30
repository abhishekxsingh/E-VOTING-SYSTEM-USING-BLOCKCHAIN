import React, { useState } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/Constant";

export const TransactionContext = React.createContext();

const { ethereum } = window;

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("0xB8475A4442d2D1c5cbE06001B5d61eceD79C6EC0");
  console.log(currentAccount)
  const [transactionCount, setTransactionCount] = useState(
    localStorage.getItem("transactionCount")
  );
  const [transactions, setTransactions] = useState([]);

  const createEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    return transactionContract;
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0] || '0xB8475A4442d2D1c5cbE06001B5d61eceD79C6EC0');
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };
  let counter = 0;
  const sendTransaction = async (election_id, candidate_id, user_id) => {
    try {
      if (ethereum) {
        const transactionsContract = createEthereumContract();
        console.log(currentAccount, user_id, election_id,candidate_id)
        const transactionHash = await transactionsContract.addToBlockchain(
          currentAccount || '0xB8475A4442d2D1c5cbE06001B5d61eceD79C6EC0',
          user_id,
          election_id,
          candidate_id
        );
        console.log(transactionHash)
        console.log(`Loading - ${transactionHash.hash}`);
        await transactionHash.wait();
        console.log(`Success - ${transactionHash.hash}`);

        // const transactionsCount =
        //   await transactionsContract.getTransactionCount();

        //console.log(transactionsCount);
        counter+=1;
        return { valid: true, mess: "Transaction Successfull" };
      } else {
        console.log("No ethereum object");
        return { valid: false, mess: "No ethereum object" };
      }
    } catch (error) {
      console.log("error",error)
      if (error.code === "ACTION_REJECTED") {
        return { valid: false, mess: "User Rejected Transaction" };
      } else {
        return { valid: false, mess: "Internal Send Transaction Error" };
      }
    }
  };

  const getAllTransactions = async () => {
    try {
      if (ethereum) {
        const transactionsContract = createEthereumContract();

        const availableTransactions =
          await transactionsContract.getAllTransaction();

        const structuredTransactions = availableTransactions.map(
          (transaction) => ({
            addressFrom: transaction.from,
            timestamp: new Date(
              transaction.timestamp.toNumber() * 1000
            ).toLocaleString(),
            election_id: transaction.election_id,
            candidate_id: transaction.candidate_id,
            user_id: transaction.user_id,
          })
        );

        setTransactions(structuredTransactions);
        return structuredTransactions;
      } else {
        console.log("Ethereum is not present");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <TransactionContext.Provider
        value={{
          connectWallet,
          currentAccount,
          sendTransaction,
          getAllTransactions,
          transactions,
        }}
      >
        {children}
      </TransactionContext.Provider>
    </>
  );
};
