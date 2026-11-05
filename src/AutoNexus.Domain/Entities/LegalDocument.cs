using AutoNexus.Domain.Enums;
namespace AutoNexus.Domain.Entities;
public class LegalDocument : EntityBase
{
 public LegalDocumentType Type { get; private set; }
 public int Version { get; private set; }
 public string Content { get; private set; } = string.Empty;
 public bool IsActive { get; private set; }
 public DateTime PublishedAt { get; private set; }
 protected LegalDocument() { }
 public LegalDocument(LegalDocumentType type, int version, string content, bool publishImmediately = true)
 {
  if (string.IsNullOrWhiteSpace(content)) throw new ArgumentException("Conteúdo do documento é obrigatório.", nameof(content));
  if (version < 1) throw new ArgumentException("Versão deve ser maior que zero.", nameof(version));
  Type=type; Version=version; Content=content.Trim(); IsActive=publishImmediately;
  PublishedAt=publishImmediately ? DateTime.UtcNow : DateTime.MinValue;
 }
 public void UpdateDraft(string content)
 {
  if (IsActive) throw new InvalidOperationException("Versão publicada é imutável. Crie outra versão.");
  if (string.IsNullOrWhiteSpace(content)) throw new ArgumentException("Conteúdo obrigatório.", nameof(content));
  Content=content.Trim(); UpdatedAt=DateTime.UtcNow;
 }
 public void Publish() { if (IsActive) return; IsActive=true; PublishedAt=DateTime.UtcNow; UpdatedAt=DateTime.UtcNow; }
 public void Retire() { IsActive=false; UpdatedAt=DateTime.UtcNow; }
}