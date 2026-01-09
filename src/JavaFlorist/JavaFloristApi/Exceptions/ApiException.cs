namespace JavaFloristApi.Exceptions
{
  /// <summary>
  /// Base exception for API operations
  /// </summary>
  public class ApiException : Exception
  {
    public int StatusCode { get; set; }
    public string ErrorCode { get; set; }

    public ApiException(string message, int statusCode = 400, string errorCode = "ERROR")
        : base(message)
    {
      StatusCode = statusCode;
      ErrorCode = errorCode;
    }
  }

  /// <summary>
  /// Thrown when validation fails
  /// </summary>
  public class ValidationException : ApiException
  {
    public Dictionary<string, string[]> Errors { get; set; }

    public ValidationException(string message, Dictionary<string, string[]> errors = null)
        : base(message, 400, "VALIDATION_ERROR")
    {
      Errors = errors ?? new Dictionary<string, string[]>();
    }
  }

  /// <summary>
  /// Thrown when user is not authenticated
  /// </summary>
  public class UnauthorizedException : ApiException
  {
    public UnauthorizedException(string message = "Unauthorized access")
        : base(message, 401, "UNAUTHORIZED")
    {
    }
  }

  /// <summary>
  /// Thrown when user does not have permission
  /// </summary>
  public class ForbiddenException : ApiException
  {
    public ForbiddenException(string message = "Access forbidden")
        : base(message, 403, "FORBIDDEN")
    {
    }
  }

  /// <summary>
  /// Thrown when resource is not found
  /// </summary>
  public class NotFoundException : ApiException
  {
    public NotFoundException(string message = "Resource not found")
        : base(message, 404, "NOT_FOUND")
    {
    }
  }

  /// <summary>
  /// Thrown when resource already exists
  /// </summary>
  public class ConflictException : ApiException
  {
    public ConflictException(string message = "Resource already exists")
        : base(message, 409, "CONFLICT")
    {
    }
  }

  /// <summary>
  /// Thrown for internal server errors
  /// </summary>
  public class InternalServerException : ApiException
  {
    public InternalServerException(string message = "Internal server error")
        : base(message, 500, "INTERNAL_SERVER_ERROR")
    {
    }
  }
}
