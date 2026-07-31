CREATE TABLE `boat_configurations` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`model` text NOT NULL,
	`configuration_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`auth_provider` text,
	`role` text DEFAULT 'prospect' NOT NULL,
	`status` text DEFAULT 'quote_requested' NOT NULL,
	`created_at` text NOT NULL
);
