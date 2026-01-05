

export class TransactionEntryPoint {
  private readonly transaction: any
  private readonly actionPayload: any;
  private readonly payloadHeader: any;

  constructor(transaction: any) {
    this.transaction = transaction;
    this.payloadHeader = transaction.payload.header;
    this.actionPayload = transaction.payload.data.actions[0].payload;
  }

  header() {
    return this.payloadHeader;
  }

  chaincodeProposalPayload() {
    return this.actionPayload.chaincode_proposal_payload;
  }

  action() {
    return this.actionPayload.action;
  }

  static action(transaction: any) {
    return transaction.payload.data.actions[0].payload.action;
  }

  endorsements(): any[] {
    return this.actionPayload.action.endorsements;
  }

  proposalResponsePayload() {
    return this.actionPayload.action.proposal_response_payload;
  }

  chaincodeSpec() {
    return this.chaincodeProposalPayload().input.chaincode_spec;
  }

  chaincodeInputArgs() {
    return this.actionPayload.chaincode_proposal_payload.input.chaincode_spec.input.args;
  }

  nsRwset() {
    return this.actionPayload.action.proposal_response_payload.extension.results.ns_rwset;
  }

  static chaincodeInputArgs(transaction: any): any[] {
    return transaction.payload.data.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec.input.args;
  }

  static nsRwset(transaction: any) : any[] {
    return transaction.payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset;
  }
}