CREATE TABLE `benchmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cpu_id` text NOT NULL,
	`gpu_id` text NOT NULL,
	`game_id` text NOT NULL,
	`resolution` text NOT NULL,
	`preset` text NOT NULL,
	`ray_tracing` integer DEFAULT false,
	`fps_low` integer NOT NULL,
	`fps_high` integer NOT NULL,
	`source` text DEFAULT 'interpolated' NOT NULL,
	`confidence` text NOT NULL,
	FOREIGN KEY (`cpu_id`) REFERENCES `cpus`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`gpu_id`) REFERENCES `gpus`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cpus` (
	`id` text PRIMARY KEY NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`generation` text,
	`socket` text NOT NULL,
	`cores` integer NOT NULL,
	`threads` integer NOT NULL,
	`base_clock_ghz` real,
	`boost_clock_ghz` real,
	`tdp_watts` integer,
	`release_year` integer,
	`relative_performance_score` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_requirements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` text NOT NULL,
	`tier` text NOT NULL,
	`cpu_text` text NOT NULL,
	`gpu_text` text NOT NULL,
	`ram_gb` integer NOT NULL,
	`storage_gb` integer,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`genre` text,
	`developer` text,
	`release_year` integer,
	`image_url` text,
	`demand_tier` integer NOT NULL,
	`supports_ray_tracing` integer DEFAULT false,
	`supports_dlss` integer DEFAULT false,
	`supports_fsr` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `gpus` (
	`id` text PRIMARY KEY NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`vram_gb` integer NOT NULL,
	`tdp_watts` integer,
	`release_year` integer,
	`supports_dlss` integer DEFAULT false,
	`supports_fsr` integer DEFAULT false,
	`supports_ray_tracing` integer DEFAULT false,
	`relative_performance_score` integer NOT NULL
);
