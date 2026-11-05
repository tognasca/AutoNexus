using AutoNexus.Domain.Entities;
using AutoNexus.Domain.Enums;
using AutoNexus.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace AutoNexus.Api.Controllers;
[ApiController]
[Route("api/superadmin/legal-documents")]
[Authorize(Roles = "SuperAdmin")]
public sealed class LegalDocumentsAdminController : ControllerBase
{
 private readonly AutoNexusDbContext _db;
 public LegalDocumentsAdminController(AutoNexusDbContext db) => _db=db;
 [HttpGet]
 public async Task<IActionResult> GetAll(CancellationToken ct)
 {
  var docs=await _db.LegalDocuments.AsNoTracking().OrderBy(x=>x.Type).ThenByDescending(x=>x.Version)
   .Select(x=>new { id=x.Id,type=(int)x.Type,version=x.Version,content=x.Content,isActive=x.IsActive,publishedAt=x.PublishedAt,createdAt=x.CreatedAt,updatedAt=x.UpdatedAt }).ToListAsync(ct);
  return Ok(docs);
 }
 [HttpPost("drafts")]
 public async Task<IActionResult> CreateDraft([FromBody] LegalDocumentDraftInput input,CancellationToken ct)
 {
  if(!Enum.IsDefined(typeof(LegalDocumentType),input.Type)) return BadRequest(new {message="Tipo inválido."});
  if(string.IsNullOrWhiteSpace(input.Content)) return BadRequest(new {message="Conteúdo obrigatório."});
  var type=(LegalDocumentType)input.Type;
  var version=(await _db.LegalDocuments.Where(x=>x.Type==type).Select(x=>(int?)x.Version).MaxAsync(ct)??0)+1;
  var draft=new LegalDocument(type,version,input.Content,false);
  _db.LegalDocuments.Add(draft); await _db.SaveChangesAsync(ct);
  return Ok(new {id=draft.Id,type=(int)draft.Type,version=draft.Version,content=draft.Content,isActive=draft.IsActive,publishedAt=(DateTime?)null,createdAt=draft.CreatedAt});
 }
 [HttpPut("drafts/{id:guid}")]
 public async Task<IActionResult> UpdateDraft(Guid id,[FromBody] LegalDocumentDraftInput input,CancellationToken ct)
 {
  var draft=await _db.LegalDocuments.FirstOrDefaultAsync(x=>x.Id==id,ct);
  if(draft==null)return NotFound(new {message="Rascunho não encontrado."});
  if(draft.IsActive)return Conflict(new {message="Versões publicadas são imutáveis."});
  if((int)draft.Type!=input.Type)return BadRequest(new {message="Tipo não pode ser alterado."});
  try { draft.UpdateDraft(input.Content); await _db.SaveChangesAsync(ct); return Ok(new {message="Rascunho salvo."}); }
  catch(ArgumentException ex){return BadRequest(new {message=ex.Message});}
 }
 [HttpPost("{id:guid}/publish")]
 public async Task<IActionResult> Publish(Guid id,CancellationToken ct)
 {
  var draft=await _db.LegalDocuments.FirstOrDefaultAsync(x=>x.Id==id,ct);
  if(draft==null)return NotFound(new {message="Documento não encontrado."});
  if(draft.IsActive)return Ok(new {message="Versão já publicada."});
  var previous=await _db.LegalDocuments.Where(x=>x.Type==draft.Type&&x.IsActive).ToListAsync(ct);
  foreach(var old in previous)old.Retire();
  draft.Publish(); await _db.SaveChangesAsync(ct);
  return Ok(new {message="Nova versão publicada.",version=draft.Version,publishedAt=draft.PublishedAt});
 }
}
public sealed record LegalDocumentDraftInput(int Type,string Content);