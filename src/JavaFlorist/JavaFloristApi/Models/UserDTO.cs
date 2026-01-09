using System;
using System.Collections.Generic;

namespace JavaFloristApi.Models
{
  /// <summary>
  /// User Data Transfer Object for API responses
  /// </summary>
  public class UserDTO
  {
    public string Id { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
    public string PhoneNumber { get; set; }
    public bool EmailConfirmed { get; set; }
    public bool LockoutEnabled { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; }
    public DateTime CreatedDate { get; set; }
    public List<string> Roles { get; set; } = new List<string>();
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Gender { get; set; }
    public string? CompanyName { get; set; }
    public string? ContactPerson { get; set; }
    public string? BusinessLicenseId { get; set; }
    }
}
