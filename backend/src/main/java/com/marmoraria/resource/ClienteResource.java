package com.marmoraria.resource;

import com.marmoraria.entity.Cliente;
import com.marmoraria.repository.ClienteRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/api/clientes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ClienteResource {

    @Inject ClienteRepository repository;

    @GET
    public List<Cliente> listar() {
        return repository.listAll();
    }

    @GET
    @Path("/{id}")
    public Cliente buscar(@PathParam("id") UUID id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Cliente não encontrado."));
    }

    @POST
    @Transactional
    public Response criar(@Valid Cliente cliente) {
        repository.persist(cliente);
        return Response.status(Response.Status.CREATED).entity(cliente).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Cliente atualizar(@PathParam("id") UUID id, @Valid Cliente dados) {
        Cliente cliente = repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Cliente não encontrado."));
        cliente.nome = dados.nome;
        cliente.telefone = dados.telefone;
        cliente.email = dados.email;
        cliente.endereco = dados.endereco;
        cliente.documento = dados.documento;
        return cliente;
    }
}
