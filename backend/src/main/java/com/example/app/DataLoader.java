package com.example.app;

import java.time.LocalDate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final TaskRepository repository;

    public DataLoader(TaskRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() == 0) {
            LocalDate today = LocalDate.now();
            repository.save(new Task(
                "Review System Architecture",
                "Review backend REST APIs and database schema for the task management app.",
                today.toString(),
                "High",
                "In Progress"
            ));
            repository.save(new Task(
                "Design Modern Dashboard UI",
                "Create a responsive, glassmorphic UI with quick filters and status badges.",
                today.plusDays(1).toString(),
                "High",
                "Completed"
            ));
            repository.save(new Task(
                "Write Automated Integration Tests",
                "Add test coverage for TaskController endpoints and repository operations.",
                today.plusDays(2).toString(),
                "Medium",
                "Pending"
            ));
            repository.save(new Task(
                "Configure Production Build & Deployment",
                "Package static frontend into Spring Boot and create container/startup scripts.",
                today.plusDays(3).toString(),
                "Medium",
                "Pending"
            ));
        }
    }
}
