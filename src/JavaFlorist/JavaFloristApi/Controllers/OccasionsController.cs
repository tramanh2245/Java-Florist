using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JavaFloristApi.Data;
using JavaFloristApi.Models;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace JavaFloristApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OccasionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OccasionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Occasions
        // Retrieve a list of all occasions (e.g., Birthday, Wedding)
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetOccasions()
        {
            return Ok(await _context.Occasions.ToListAsync());
        }

        // GET: api/Occasions/{id}/messages
        // Retrieve suggested messages for a specific occasion
        [HttpGet("{id}/messages")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMessagesByOccasion(int id)
        {
            var messages = await _context.OccasionMessages
                .Where(m => m.OccasionId == id)
                .ToListAsync();

            return Ok(messages);
        }
    }
}