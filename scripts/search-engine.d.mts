export type IndexItem = [string,string,string,string,string,number,string,string[]?];
export type IndexPage = {u:string;g:"guide"|"raid"|"tool"|"data";t:string;k?:string;d:string;s?:string};
export type SearchIndex = {schemaVersion?:number;pages:IndexPage[];items:IndexItem[];drops?:IndexItem[]};
export type SearchResult = {kind:string;name:string;meta:string;badge:string;url:string;exclusive:boolean;score?:number};
export function normalizeSearch(value:unknown):string;
export function expandSearchText(value:unknown):string;
export function searchIndex(index:SearchIndex|null, query:string, translate?:(key:string,fallback:string)=>string, scope?:string):SearchResult[];

