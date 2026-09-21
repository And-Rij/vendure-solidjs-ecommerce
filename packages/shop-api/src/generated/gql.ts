/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {\n  addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {\n    __typename\n    ... on Order {\n      id\n      code\n      totalQuantity\n      totalWithTax\n      currencyCode\n    }\n    ... on ErrorResult {\n      errorCode\n      message\n    }\n  }\n}\n\nquery GetActiveOrder {\n  activeOrder {\n    id\n    code\n    totalQuantity\n    totalWithTax\n    currencyCode\n  }\n}": typeof types.AddItemToOrderDocument,
    "query GetProductBySlug($slug: String!) {\n  product(slug: $slug) {\n    id\n    name\n    slug\n    description\n    variants {\n      id\n      name\n      sku\n      currencyCode\n      priceWithTax\n      stockLevel\n      options {\n        code\n        name\n        group {\n          code\n          name\n        }\n      }\n    }\n  }\n}": typeof types.GetProductBySlugDocument,
};
const documents: Documents = {
    "mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {\n  addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {\n    __typename\n    ... on Order {\n      id\n      code\n      totalQuantity\n      totalWithTax\n      currencyCode\n    }\n    ... on ErrorResult {\n      errorCode\n      message\n    }\n  }\n}\n\nquery GetActiveOrder {\n  activeOrder {\n    id\n    code\n    totalQuantity\n    totalWithTax\n    currencyCode\n  }\n}": types.AddItemToOrderDocument,
    "query GetProductBySlug($slug: String!) {\n  product(slug: $slug) {\n    id\n    name\n    slug\n    description\n    variants {\n      id\n      name\n      sku\n      currencyCode\n      priceWithTax\n      stockLevel\n      options {\n        code\n        name\n        group {\n          code\n          name\n        }\n      }\n    }\n  }\n}": types.GetProductBySlugDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {\n  addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {\n    __typename\n    ... on Order {\n      id\n      code\n      totalQuantity\n      totalWithTax\n      currencyCode\n    }\n    ... on ErrorResult {\n      errorCode\n      message\n    }\n  }\n}\n\nquery GetActiveOrder {\n  activeOrder {\n    id\n    code\n    totalQuantity\n    totalWithTax\n    currencyCode\n  }\n}"): (typeof documents)["mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {\n  addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {\n    __typename\n    ... on Order {\n      id\n      code\n      totalQuantity\n      totalWithTax\n      currencyCode\n    }\n    ... on ErrorResult {\n      errorCode\n      message\n    }\n  }\n}\n\nquery GetActiveOrder {\n  activeOrder {\n    id\n    code\n    totalQuantity\n    totalWithTax\n    currencyCode\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetProductBySlug($slug: String!) {\n  product(slug: $slug) {\n    id\n    name\n    slug\n    description\n    variants {\n      id\n      name\n      sku\n      currencyCode\n      priceWithTax\n      stockLevel\n      options {\n        code\n        name\n        group {\n          code\n          name\n        }\n      }\n    }\n  }\n}"): (typeof documents)["query GetProductBySlug($slug: String!) {\n  product(slug: $slug) {\n    id\n    name\n    slug\n    description\n    variants {\n      id\n      name\n      sku\n      currencyCode\n      priceWithTax\n      stockLevel\n      options {\n        code\n        name\n        group {\n          code\n          name\n        }\n      }\n    }\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;