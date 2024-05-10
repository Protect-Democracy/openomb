output "alb_url" {
  value = "http://${aws_alb.apportionments_app.dns_name}"
}

output "ecs_cluster_arn" {
  value = aws_ecs_cluster.apportionments_app.arn
}

output "app_task_definition_arn" {
  value = aws_ecs_task_definition.apportionments_app.arn
}

output "collect_task_definition_arn" {
  value = aws_ecs_task_definition.apportionments_collect.arn
}

output "migrate_task_definition_arn" {
  value = aws_ecs_task_definition.apportionments_migrate.arn
}

output "run_task_network_configuration_string" {
  value = "awsvpcConfiguration={subnets=[${aws_subnet.private_a.id},${aws_subnet.private_b.id}],securityGroups=[${aws_security_group.egress_all.id},${aws_security_group.database.id}],assignPublicIp=DISABLED}"
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.cf_dist.id
}
