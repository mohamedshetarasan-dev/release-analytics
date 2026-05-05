import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const releases = sqliteTable('releases', {
  id:           text('id').primaryKey(),
  version:      text('version').notNull().unique(),
  name:         text('name'),
  status:       text('status', { enum: ['active', 'completed'] }).notNull().default('active'),
  importJobId:  text('import_job_id').references(() => importJobs.id),
  createdAt:    integer('created_at').notNull(),
});

export const workItems = sqliteTable('work_items', {
  id:             text('id').primaryKey(),
  azureId:        text('azure_id').notNull().unique(),
  releaseVersion: text('release_version'),
  parentAzureId:  text('parent_azure_id'),
  type:           text('type', { enum: ['user_story', 'task', 'bug', 'feature'] }).notNull(),
  title:          text('title').notNull(),
  state:          text('state').notNull(),
  assignedTo:     text('assigned_to'),
  tags:           text('tags'),
  createdDate:    integer('created_date'),
  activatedDate:  integer('activated_date'),
  resolvedDate:   integer('resolved_date'),
  closedDate:     integer('closed_date'),
  iterationPath:  text('iteration_path'),
  plannedHours:   real('planned_hours'),
  actualHours:    real('actual_hours'),
  storyPoints:    real('story_points'),
  severity:       text('severity'),
});

export const importJobs = sqliteTable('import_jobs', {
  id:           text('id').primaryKey(),
  filename:     text('filename').notNull(),
  status:       text('status', { enum: ['pending', 'processing', 'completed', 'failed'] }).notNull().default('pending'),
  rowCount:     integer('row_count'),
  rowsImported: integer('rows_imported'),
  rowsSkipped:  integer('rows_skipped'),
  rowsFailed:   integer('rows_failed'),
  errorMessage: text('error_message'),
  createdAt:    integer('created_at').notNull(),
  completedAt:  integer('completed_at'),
});
