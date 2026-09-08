package com.marmoraria.resource;

import com.marmoraria.entity.OrdemServico;
import com.marmoraria.repository.OrdemServicoRepository;
import com.marmoraria.service.OrdemServicoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Path("/api/ordens-servico")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OrdemServicoResource {

    @Inject OrdemServicoRepository repository;
    @Inject OrdemServicoService service;

    /** Lista todas as OS, agrupáveis por fase no frontend para montar o Kanban. */
    @GET
    public List<OrdemServico> listar() {
        return repository.listAll();
    }

    @GET
    @Path("/{id}")
    public OrdemServico buscar(@PathParam("id") UUID id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Ordem de Serviço não encontrada."));
    }

    public static class CriarOSRequest {
        public UUID orcamentoId;
        public String responsavel;
    }

    @POST
    public Response criar(CriarOSRequest req) {
        OrdemServico os = service.criarAPartirDeOrcamento(req.orcamentoId, req.responsavel);
        return Response.status(Response.Status.CREATED).entity(os).build();
    }

    public static class MoverFaseRequest {
        public OrdemServico.Fase novaFase;
        public String alteradoPor;
    }

    /** Move a OS de fase (drag-and-drop no Kanban do frontend chama este endpoint). */
    @PATCH
    @Path("/{id}/fase")
    public OrdemServico moverFase(@PathParam("id") UUID id, MoverFaseRequest req) {
        return service.avancarFase(id, req.novaFase, req.alteradoPor);
    }

    @GET
    @Path("/fases")
    public List<String> listarFasesValidas() {
        return List.of("RASCUNHO", "MEDICAO_FINA", "CORTE", "LAPIDACAO_ACABAMENTO",
                "MONTAGEM", "INSTALACAO", "CONCLUIDO");
    }
}
