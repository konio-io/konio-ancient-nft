import { Nft, common } from "@koinosbox/contracts";

export class KonioAncientNft extends Nft {
  _name: string = "Konio Ancient";
  _symbol: string = "KOAN";
  _uri: string = "https://nft.konio.io/ancient"

  /**
   * Get name of the NFT
   * @external
   * @readonly
   */
  name(): common.str {
    return new common.str(this._name);
  }
}
