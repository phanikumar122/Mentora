package com.mentora.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "timetable")
public class Timetable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @Column(name = "day_of_week", nullable = false)
    private String dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private String startTime;

    @Column(name = "end_time", nullable = false)
    private String endTime;

    @Column(name = "room_number")
    private String roomNumber;

    public Timetable() {}

    public Timetable(Long id, Subject subject, Teacher teacher, String dayOfWeek, String startTime, String endTime, String roomNumber) {
        this.id = id;
        this.subject = subject;
        this.teacher = teacher;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.roomNumber = roomNumber;
    }

    public static TimetableBuilder builder() {
        return new TimetableBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public Teacher getTeacher() { return teacher; }
    public void setTeacher(Teacher teacher) { this.teacher = teacher; }

    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public static class TimetableBuilder {
        private Long id;
        private Subject subject;
        private Teacher teacher;
        private String dayOfWeek;
        private String startTime;
        private String endTime;
        private String roomNumber;

        public TimetableBuilder id(Long id) { this.id = id; return this; }
        public TimetableBuilder subject(Subject subject) { this.subject = subject; return this; }
        public TimetableBuilder teacher(Teacher teacher) { this.teacher = teacher; return this; }
        public TimetableBuilder dayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; return this; }
        public TimetableBuilder startTime(String startTime) { this.startTime = startTime; return this; }
        public TimetableBuilder endTime(String endTime) { this.endTime = endTime; return this; }
        public TimetableBuilder roomNumber(String roomNumber) { this.roomNumber = roomNumber; return this; }

        public Timetable build() {
            return new Timetable(id, subject, teacher, dayOfWeek, startTime, endTime, roomNumber);
        }
    }
}
