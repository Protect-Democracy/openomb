resource "aws_appautoscaling_target" "apportionments_app" {
  service_namespace  = "ecs"
  scalable_dimension = "ecs:service:DesiredCount"
  resource_id        = "service/${aws_ecs_cluster.apportionments_app.name}/${aws_ecs_service.apportionments_app.name}"
  min_capacity       = 1
  max_capacity       = 3
}

resource "aws_appautoscaling_policy" "apportionments_app_cpu" {
  name               = "apportionments-app-cpu-target-tracking"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.apportionments_app.service_namespace
  scalable_dimension = aws_appautoscaling_target.apportionments_app.scalable_dimension
  resource_id        = aws_appautoscaling_target.apportionments_app.resource_id

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "apportionments_app_memory" {
  name               = "apportionments-app-memory-target-tracking"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.apportionments_app.service_namespace
  scalable_dimension = aws_appautoscaling_target.apportionments_app.scalable_dimension
  resource_id        = aws_appautoscaling_target.apportionments_app.resource_id

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
