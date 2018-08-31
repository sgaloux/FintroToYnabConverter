import { Moment } from "moment";

export interface IYnabRow {
  Check: string;
  Date: Moment;
  Payee: string;
  Category: string;
  Memo: string;
  Outflow: number;
  Inflow: number;
}
