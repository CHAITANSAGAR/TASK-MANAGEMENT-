package com.example.app;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://localhost:8080", "http://localhost:3000"})
public class TaskController {

    private final TaskRepository repository;

    public TaskController(TaskRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Task> getAllTasks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority) {
        List<Task> tasks = repository.findAll();

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            tasks = tasks.stream()
                    .filter(t -> (t.getTitle() != null && t.getTitle().toLowerCase().contains(q))
                            || (t.getDescription() != null && t.getDescription().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("All")) {
            tasks = tasks.stream()
                    .filter(t -> t.getStatus() != null && t.getStatus().equalsIgnoreCase(status.trim()))
                    .collect(Collectors.toList());
        }

        if (priority != null && !priority.trim().isEmpty() && !priority.equalsIgnoreCase("All")) {
            tasks = tasks.stream()
                    .filter(t -> t.getPriority() != null && t.getPriority().equalsIgnoreCase(priority.trim()))
                    .collect(Collectors.toList());
        }

        return tasks;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> addTask(@Valid @RequestBody Task task) {
        if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Task title is required"));
        }
        if (task.getDueDate() == null || task.getDueDate().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Due date is required"));
        }

        if (task.getPriority() == null || task.getPriority().trim().isEmpty()) {
            task.setPriority("Medium");
        }
        if (task.getStatus() == null || task.getStatus().trim().isEmpty()) {
            task.setStatus("Pending");
        }

        task.setId(null);
        Task saved = repository.save(task);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody Task updated) {
        if (updated.getTitle() == null || updated.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Task title cannot be blank"));
        }
        if (updated.getDueDate() == null || updated.getDueDate().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Due date cannot be blank"));
        }

        return repository.findById(id).map(task -> {
            task.setTitle(updated.getTitle().trim());
            task.setDescription(updated.getDescription());
            task.setDueDate(updated.getDueDate());
            task.setPriority(updated.getPriority() != null ? updated.getPriority() : "Medium");
            task.setStatus(updated.getStatus() != null ? updated.getStatus() : "Pending");
            return ResponseEntity.ok(repository.save(task));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
        }

        return repository.findById(id).map(task -> {
            task.setStatus(newStatus.trim());
            return ResponseEntity.ok(repository.save(task));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
