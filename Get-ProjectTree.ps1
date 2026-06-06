param (
    [string]$Path = ".",
    [string]$OutputFile = "project_tree.json"
)

function Get-DirectoryTree {
    param (
        [string]$Path
    )
    
    $tree = @{}
    $items = Get-ChildItem -Path $Path -Force | Where-Object { $_.Name -ne "node_modules" }
    
    foreach ($item in $items) {
        if ($item.PSIsContainer) {
            $tree[$item.Name] = Get-DirectoryTree -Path $item.FullName
        } else {
            $tree[$item.Name] = $null
        }
    }
    
    return $tree
}

$projectTree = Get-DirectoryTree -Path (Resolve-Path $Path)
$jsonOutput = $projectTree | ConvertTo-Json -Depth 100

# Get the directory of the current script
$scriptDir = $PSScriptRoot

# Save the JSON output to a file in the same directory as the script
$outputPath = Join-Path -Path $scriptDir -ChildPath $OutputFile
$jsonOutput | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host "Project tree JSON has been saved to: $outputPath"