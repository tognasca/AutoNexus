import { request } from './api';
export interface AdminLegalDocument { id:string; type:number; version:number; content:string; isActive:boolean; publishedAt:string|null; createdAt:string; updatedAt?:string|null; }
export const legalDocumentsAdminService = {
 getAll:()=>request<AdminLegalDocument[]>('/superadmin/legal-documents'),
 createDraft:(type:number,content:string)=>request<AdminLegalDocument>('/superadmin/legal-documents/drafts',{method:'POST',body:JSON.stringify({type,content})}),
 updateDraft:(id:string,type:number,content:string)=>request<{message:string}>(`/superadmin/legal-documents/drafts/${id}`,{method:'PUT',body:JSON.stringify({type,content})}),
 publish:(id:string)=>request<{message:string;version:number;publishedAt:string}>(`/superadmin/legal-documents/${id}/publish`,{method:'POST'})
};