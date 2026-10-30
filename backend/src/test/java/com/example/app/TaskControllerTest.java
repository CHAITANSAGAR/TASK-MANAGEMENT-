package com.example.app;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TaskRepository repository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void testCreateTaskAndGetAll() throws Exception {
        Task task = new Task("Test Task 1", "Description 1", "2026-11-01", "High", "Pending");

        mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(task)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Test Task 1"))
                .andExpect(jsonPath("$.priority").value("High"));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Test Task 1"));
    }

    @Test
    void testValidationFailureOnEmptyTitle() throws Exception {
        Task invalidTask = new Task("", "No title", "2026-11-01", "Low", "Pending");

        mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidTask)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUpdateTask() throws Exception {
        Task saved = repository.save(new Task("Initial Task", "Initial desc", "2026-11-01", "Low", "Pending"));

        saved.setTitle("Updated Task");
        saved.setStatus("Completed");

        mockMvc.perform(put("/api/tasks/" + saved.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(saved)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Task"))
                .andExpect(jsonPath("$.status").value("Completed"));
    }

    @Test
    void testPatchStatus() throws Exception {
        Task saved = repository.save(new Task("Status Test", "Desc", "2026-11-01", "Medium", "Pending"));

        mockMvc.perform(patch("/api/tasks/" + saved.getId() + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "In Progress"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("In Progress"));
    }

    @Test
    void testDeleteTask() throws Exception {
        Task saved = repository.save(new Task("Delete Me", "To be deleted", "2026-11-01", "Medium", "Pending"));

        mockMvc.perform(delete("/api/tasks/" + saved.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/tasks/" + saved.getId()))
                .andExpect(status().isNotFound());
    }
}
