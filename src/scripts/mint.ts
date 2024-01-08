import { Signer, Contract, Provider, Transaction } from "koilib";
import { TransactionJson } from "koilib/lib/interface";
import abi from "../build/konioancientnft-abi.json";
import koinosConfig from "../koinos.config.js";

const TOTAL_NFTS = 48;
const NFTS_PER_TX = 4;
const BUCKET_URL = "https://nft.konio.io/ancient";

const [inputNetworkName] = process.argv.slice(2);

async function main() {
  const networkName = inputNetworkName || "harbinger";
  const network = koinosConfig.networks[networkName];
  if (!network) throw new Error(`network ${networkName} not found`);
  const provider = new Provider(network.rpcNodes);
  const accountWithFunds = Signer.fromWif(
    network.accounts.manaSharer.privateKey
  );
  const contractAccount = Signer.fromWif(network.accounts.contract.privateKey);
  accountWithFunds.provider = provider;
  contractAccount.provider = provider;

  const contract = new Contract({
    signer: contractAccount,
    provider,
    abi,
    options: {
      payer: accountWithFunds.address,
      beforeSend: async (tx: TransactionJson) => {
        await accountWithFunds.signTransaction(tx);
      },
      rcLimit: "5000000000",
    },
  });

  let current = 1;
  while (current < TOTAL_NFTS) {
    const tx = new Transaction({
      signer: contractAccount,
      provider,
      options: {
        payer: accountWithFunds.address,
        beforeSend: async (tx: TransactionJson) => {
          await accountWithFunds.signTransaction(tx);
        },
        rcLimit: "500000000",
      },
    });

    for (let i = current; i < current + NFTS_PER_TX; i += 1) {
      const tokenId = `0x${Buffer.from(Number(i).toString()).toString("hex")}`;

      const response = await fetch(`${BUCKET_URL}/${tokenId}`);
      const data = await response.json();

      await tx.pushOperation(contract.functions.mint, {
        token_id: tokenId,
        to: contract.getId(),
      });
      await tx.pushOperation(contract.functions.set_metadata, {
        token_id: tokenId,
        metadata: JSON.stringify(data),
      });
    }

    const receipt = await tx.send();
    console.log(
      `Transaction submitted: from ${current} to ${current + NFTS_PER_TX - 1}`
    );
    console.log(
      `consumption: ${(Number(receipt.rc_used) / 1e8).toFixed(2)} mana`
    );
    const { blockNumber } = await tx.wait("byBlock", 60000);
    console.log(`mined in block ${blockNumber} (${networkName})`);
    current += NFTS_PER_TX;
  }
}

main()
  .then(() => {})
  .catch((error) => console.error(error));
