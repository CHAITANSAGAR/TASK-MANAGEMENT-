package com.example.app;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @NotBlank(message = "Due date is required")
    private String dueDate;   // yyyy-MM-dd

    private String priority = "Medium";  // Low, Medium, High
    private String status = "Pending";    // Pending, In Progress, Completed

    public Task() {
    }

    public Task(String title, String description, String dueDate, String priority, String status) {
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = (priority != null && !priority.trim().isEmpty()) ? priority : "Medium";
        this.status = (status != null && !status.trim().isEmpty()) ? status : "Pending";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
