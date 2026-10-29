namespace AutoNexus.Domain.Interfaces;

public interface IUnitOfWork
{
    Task<int> CommitAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Descarta alterações pendentes ainda não salvas (usado quando uma
    /// operação falha no meio e não queremos persistir um estado parcial —
    /// ex.: processamento de webhook que deu erro).
    /// </summary>
    void DiscardChanges();

    /// <summary>Executa a operação em transação serializável, para evitar efeitos financeiros duplicados em webhooks concorrentes.</summary>
    Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken cancellationToken = default);
}