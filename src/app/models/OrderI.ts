import {ProductOrder} from './ProductI';
import {OrderChange} from './Changes';


export enum OrderStatus {

  // Draft - customer only
  DRAFT = 0,

  // Sent, but has not opened by the supplier yet
  SENT = 10,
  EDITED = 11,

  // Opened by the supplier
  OPENED = 20,
  // Changed by customer after opened
  CHANGED = 21,

  APPROVED = 30,
  APPROVED_WITH_CHANGES = 31,

  FINAL_APPROVE = 80,
  FINAL_APPROVE_WITH_CHANGES = 81,

  CLOSED = 100,

  CANCELED = 400,
  CANCELED_BY_CUSTOMER = 401,
  CANCELED_BY_SUPPLIER = 402,

}

export const OrderStatusGroup = [
  [OrderStatus.SENT, OrderStatus.EDITED, OrderStatus.OPENED, OrderStatus.CHANGED, OrderStatus.APPROVED, OrderStatus.APPROVED_WITH_CHANGES],
  [OrderStatus.FINAL_APPROVE, OrderStatus.FINAL_APPROVE_WITH_CHANGES],
  [OrderStatus.CLOSED],
  [OrderStatus.CANCELED_BY_CUSTOMER, OrderStatus.CANCELED_BY_SUPPLIER],
];


export interface OrderDoc {

  /** Server ID */
  id?: string;

  /** Order serial number (yy-serial)*/
  serial?: string;

  /** Customer ID */
  cid?: string;

  /** Supplier ID */
  sid?: string;

  /** List of products to order (Each contains productOrder ID + order's content) */
  products?: ProductOrder[];

  /** General comment for the supplier about the order */
  comment?: string;

  /** General comment from the supplier about the order */
  supplierComment?: string;

  /** Time of supply */
  supplyTime?: number;

  /** Order status */
  status?: OrderStatus;

  /** Invoice no. */
  invoice?: string;

  /** Name of the driver */
  driverName?: string;

  /** Time of creation (according to client time) */
  created?: number;

  /** Time of last update on server (according to server time) */
  modified?: number;

  /** List of changes */
  changes?: OrderChange[];

  /** Notifications flags */
  adminAlerts?: AdminAlerts;

}

export type AdminAlerts = {

  /** Last time that a notification of "has not been opened yet" has been sent (Before notification sent, it's the creation time)*/
  nAfter24?: number;

  /** Flag that notification has already sent to the supplier 24 hours before the order supply time, and has not been finally approved yet */
  n24Before?: boolean;

}
